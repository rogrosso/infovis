import { kdTreeFactory } from 'kdTree'
// In this implementation of UMAP we follow the notation given in the literature
// P = the distribution in the high-dimensional space, which gives the probability that two points are connected
// Q = the distribution in the low-dimensional space, which gives the probability that two points are connected
// We are also going to talk about weights. The distribution P is high-dimensional space is used to computed
// the weights we assign to edges in the graph, which are then used to optimize the low-dimensional embedding. 
// We use the dataset of the Swiss Roll, which is a 3D dataset that can be unrolled in a 2D space, to test our implementation of UMAP.


// Global constants
// Size of low-dimensional embedding
const Q_SIZE = 10
const width = Q_SIZE
const height = Q_SIZE
const radius = Q_SIZE / 100

// Data set Swiss Roll
function generateSwissRoll(nPoints = 500, noise = 0.05) {
    const data = []
    for (let i = 0; i < nPoints; i++) {
        // t determines the position along the spiral
        const t = 1.5 * Math.PI * (1 + 2 * Math.random())
        // w determines the width (the height of the roll)
        const w = 20 * Math.random()

        const x = t * Math.cos(t)
        const y = w
        const z = t * Math.sin(t)

        // Add some Gaussian-like noise
        const nx = x + (Math.random() - 0.5) * noise
        const ny = y + (Math.random() - 0.5) * noise
        const nz = z + (Math.random() - 0.5) * noise

        data.push({
            x: nx, // use naming convention for points used in kd-tree
            y: ny,
            z: nz,
            t: t, // Use 't' for color mapping to see the "unrolling"
            index: i
        })
    }
    return data
}

// Euclidean distance function for 3D points
function distance(n1, n2) {
    const dx = n1.x - n2.x
    const dy = n1.y - n2.y
    const dz = n1.z - n2.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
// For performance introduce an Euclidean distance for the low-dimensional space, which is used in the optimization.
// pCompute the direction from n1 to n2, and the distance between them.
function distance2D(n1, n2) {
    let dx = n2.x - n1.x
    let dy = n2.y - n1.y
    let d = Math.sqrt(dx * dx + dy * dy)
    if (d === 0) {
        dx = (Math.random() - 0.5) * 1e-4
        dy = (Math.random() - 0.5) * 1e-4
        d = Math.sqrt(dx * dx + dy * dy)
    }
    return { x: dx / d, y: dy / d, d: d }
}

function lowDimensionalSimilarity(distance, a, b) {
    return 1 / (1 + a * distance ** (2 * b))
}

function umapFitTarget(distance, minDist, spread) {
    if (distance <= minDist) return 1
    return Math.exp(-(distance - minDist) / spread)
}

function computeABParams(minDist = 0.1, spread = 1) {
    const safeMinDist = Math.max(0, minDist)
    const safeSpread = Math.max(spread, 1e-6)
    const maxDistance = Math.max(3 * safeSpread + safeMinDist, 3 * safeSpread, 1)
    const sampleCount = 256
    const distances = new Array(sampleCount)
    const target = new Array(sampleCount)

    for (let i = 0; i < sampleCount; i++) {
        const distance = maxDistance * i / (sampleCount - 1)
        distances[i] = distance
        target[i] = umapFitTarget(distance, safeMinDist, safeSpread)
    }

    function fitError(a, b) {
        let error = 0
        for (let i = 0; i < sampleCount; i++) {
            const diff = lowDimensionalSimilarity(distances[i], a, b) - target[i]
            error += diff * diff
        }
        return error
    }

    let bestA = 1
    let bestB = 1
    let bestError = Infinity

    const coarseALogMin = -2
    const coarseALogMax = 2
    const coarseASteps = 25
    const coarseBMin = 0.25
    const coarseBMax = 3
    const coarseBSteps = 24
    for (let i = 0; i < coarseASteps; i++) {
        const tA = i / (coarseASteps - 1)
        const a = 10 ** (coarseALogMin + tA * (coarseALogMax - coarseALogMin))
        for (let j = 0; j < coarseBSteps; j++) {
            const tB = j / (coarseBSteps - 1)
            const b = coarseBMin + tB * (coarseBMax - coarseBMin)
            const error = fitError(a, b)
            if (error < bestError) {
                bestA = a
                bestB = b
                bestError = error
            }
        }
    }

    const refineALogCenter = Math.log10(bestA)
    const refineALogSpan = 0.5
    const refineASteps = 41
    const refineBMin = Math.max(0.05, bestB - 0.5)
    const refineBMax = bestB + 0.5
    const refineBSteps = 41
    for (let i = 0; i < refineASteps; i++) {
        const tA = i / (refineASteps - 1)
        const a = 10 ** (refineALogCenter - refineALogSpan + 2 * refineALogSpan * tA)
        for (let j = 0; j < refineBSteps; j++) {
            const tB = j / (refineBSteps - 1)
            const b = refineBMin + tB * (refineBMax - refineBMin)
            const error = fitError(a, b)
            if (error < bestError) {
                bestA = a
                bestB = b
                bestError = error
            }
        }
    }

    return { a: bestA, b: bestB }
}

function checkIndex(knn, index) {
    return knn.some(n => n.index === index);
}

function normalizeVector(vector) {
    let norm = 0
    for (const value of vector) norm += value * value
    norm = Math.sqrt(norm)
    if (norm < 1e-12) return false
    for (let i = 0; i < vector.length; i++) vector[i] /= norm
    return true
}

function orthogonalizeVector(vector, basis) {
    for (const base of basis) {
        let dot = 0
        for (let i = 0; i < vector.length; i++) dot += vector[i] * base[i]
        for (let i = 0; i < vector.length; i++) vector[i] -= dot * base[i]
    }
    return normalizeVector(vector)
}

function createRandomEmbedding(vertices) {
    const q = new Array(vertices.length).fill(null).map(() => ({index: -1, x: 0, y: 0, r: 0}))
    for (let v of vertices) {
        q[v.index].x = Q_SIZE * (Math.random() - 0.5)
        q[v.index].y = Q_SIZE * (Math.random() - 0.5)
        q[v.index].index = v.index
        q[v.index].r = radius
        q[v.index].t = v.t
    }
    return q
}

function deterministicVector(length, frequency) {
    const vector = new Array(length)
    const scale = Math.max(1, length - 1)
    for (let i = 0; i < length; i++) {
        const angle = 2 * Math.PI * frequency * i / scale
        vector[i] = Math.cos(angle) + 0.5 * Math.sin(0.5 * angle)
    }
    return vector
}

function createSpectralEmbedding(vertices, edges) {
    const nodeCount = vertices.length
    if (nodeCount === 0) return []

    const adjacency = new Array(nodeCount).fill(null).map(() => [])
    const degrees = new Array(nodeCount).fill(0)
    for (const edge of edges) {
        adjacency[edge.source].push({ index: edge.target, weight: edge.weight })
        adjacency[edge.target].push({ index: edge.source, weight: edge.weight })
        degrees[edge.source] += edge.weight
        degrees[edge.target] += edge.weight
    }

    const totalDegree = degrees.reduce((sum, degree) => sum + degree, 0)
    if (totalDegree <= 0) return createRandomEmbedding(vertices)

    const trivialEigenvector = new Array(nodeCount)
    for (let i = 0; i < nodeCount; i++) trivialEigenvector[i] = Math.sqrt(degrees[i] / totalDegree)
    normalizeVector(trivialEigenvector)

    function multiplyNormalizedAdjacency(vector) {
        const result = new Array(nodeCount).fill(0)
        for (let i = 0; i < nodeCount; i++) {
            const degreeI = degrees[i]
            if (degreeI <= 0) continue
            const invSqrtDegreeI = 1 / Math.sqrt(degreeI)
            for (const neighbor of adjacency[i]) {
                const degreeJ = degrees[neighbor.index]
                if (degreeJ <= 0) continue
                result[i] += neighbor.weight * invSqrtDegreeI * vector[neighbor.index] / Math.sqrt(degreeJ)
            }
        }
        return result
    }

    const basis = []
    const maxIterations = 60
    for (const frequency of [1, 2]) {
        let candidate = deterministicVector(nodeCount, frequency)
        if (!orthogonalizeVector(candidate, [trivialEigenvector, ...basis])) {
            return createRandomEmbedding(vertices)
        }

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            candidate = multiplyNormalizedAdjacency(candidate)
            if (!orthogonalizeVector(candidate, [trivialEigenvector, ...basis])) {
                return createRandomEmbedding(vertices)
            }
        }
        basis.push(candidate)
    }

    if (basis.length < 2) return createRandomEmbedding(vertices)

    const embedding = new Array(nodeCount).fill(null).map(() => ({index: -1, x: 0, y: 0, r: 0}))
    const spectralRadius = 0.2 * Q_SIZE
    let maxAbs = 0
    for (let i = 0; i < nodeCount; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(basis[0][i]), Math.abs(basis[1][i]))
    }
    const scale = maxAbs > 1e-12 ? spectralRadius / maxAbs : 1

    let maxx = -Infinity
    let minx = Infinity
    let maxy = -Infinity
    let miny = Infinity
    for (let i = 0; i < nodeCount; i++) {
        embedding[i].index = i
        embedding[i].x = basis[0][i] * scale
        embedding[i].y = basis[1][i] * scale
        embedding[i].r = radius
        embedding[i].t = vertices[i].t
        // compute max and min for x and y to scale the embedding to fit the Q_SIZE
        if (embedding[i].x > maxx) maxx = embedding[i].x
        if (embedding[i].x < minx) minx = embedding[i].x
        if (embedding[i].y > maxy) maxy = embedding[i].y
        if (embedding[i].y < miny) miny = embedding[i].y
    }
    // scale the embedding to fit the Q_SIZE
    const distWall = 3 * radius
    const xScale = (Q_SIZE - distWall) / (maxx - minx)
    const yScale = (Q_SIZE - distWall) / (maxy - miny)
    for (let i = 0; i < nodeCount; i++) {
        embedding[i].x = (embedding[i].x - minx) * xScale - Q_SIZE / 2 //+ radius
        embedding[i].y = (embedding[i].y - miny) * yScale - Q_SIZE / 2 //+ radius
    }
    return embedding
}

function createInitialEmbedding(vertices, edges, initialization = 'random') {
    if (initialization === 'spectral') {
        return createSpectralEmbedding(vertices, edges)
    }
    return createRandomEmbedding(vertices)
}

function checkKNN(target, knn, vertices) {
    const bruteForce = vertices
        .map(v => ({
            index: v.index,
            distance: (target.x - v.x) ** 2 + (target.y - v.y) ** 2 + (target.z - v.z) ** 2,
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, knn.length)

    if (knn.length > 0 && knn[0].index !== target.index) {
        console.log(`KNN target mismatch: expected ${target.index}, got ${knn[0].index}`)
        return false
    }

    for (let i = 0; i < bruteForce.length; i++) {
        if (knn[i].index !== bruteForce[i].index) {
            console.log(
                `KNN mismatch for ${target.index} at rank ${i}: expected ${bruteForce[i].index}, got ${knn[i].index}`
            )
            return false
        }
    }

    return true
}
function computeNetwork(vertices, k = 15, initialization = 'random') {
    const kdTree = kdTreeFactory(vertices, distance)
    // compute edges based on the k nearest neighbors
    const neighbors = new Array(vertices.length).fill(null).map(() => ({
        index: -1, 
        point: undefined, 
        rho: 0,
        sigma: 0,
        nn: []
    }))
    for (let v of vertices) {
        neighbors[v.index].index = v.index
        neighbors[v.index].point = v
        const nn = neighbors[v.index].nn
        const knn = kdTree.knn(v, k + 1) // +1 to include the point itself
        //checkKNN(v, knn, vertices)
        for (let i = 1; i < knn.length; i++) { // Start from 1 to skip the point itself
            // update neighbors with the k nearest neighbors
            // using squared distance in kd-tree, so take the square root for actual distance
            const nv = {index: knn[i].index, distance: Math.max(0, Math.sqrt(knn[i].distance))} // introduce this vector for debugging purposes, to check the distances between neighbors
            nn.push(nv)
        }
    }
    // compute edge weights based on the distances between points
    const edges = computeEdges(neighbors)

    const q = createInitialEmbedding(vertices, edges, initialization)

    // Scale the embedding to avoid to strong attracting forces at the beginning of the iteration 
    // 1. compute mean position of the embedding
    let meanX = 0
    let meanY = 0
    for (let v of q) {
        meanX += v.x
        meanY += v.y
    }
    meanX /= q.length
    meanY /= q.length
    // 2. shift to origin
    for (let v of q) {
        v.x -= meanX
        v.y -= meanY
    }
    // scale
    const scale = 0.9
    for (let v of q) {
        v.x *= scale
        v.y *= scale
    }


    return {
        q: q,
        p: vertices,
        neighbors,
        edges
    }
}

// Compute sigma for the distribution P in high-dimensional space 
// Apparently, the function is well behaved, we implement a bisection method for the search.
function computeSigma(nn, rho, k) {

}

// In this implementation of UMAP each edge is unique and considered to be symmetric. 
// First compute the weights for all edges connecting one vertex to its k nearest neighbors
// Then make the weights symmetric by combining the weights of the edges in both directions.
// Store each edge only once.
function computeEdges(neighbors) {
    for (let n of neighbors) {
        // collect neighborhood
        const nn = n.nn
        const k = nn.length
        const rho = nn[0].distance // distance to the closest neighbor
        // compute sigma using binary search to satisfy the condition that the sum of the probabilities is equal to log2(k)
        const sigma = computeSigma(nn, rho, k)

        // compute sigma using binary search to satisfy the condition that the sum of the probabilities is equal 
        // to log2(k)
        let sum = 0
        let low = 0
        let high = Infinity
        let mid = 1
        let sigma = mid
        const log2k = Math.log2(k)
        const tinny = 1e-14
        while (Math.abs(high - low) > 1e-5) {
            sum = 0
            for (let i = 0; i < k; i++) {
                const d = nn[i].distance - rho
                if (d > 0) {
                    sum += Math.exp(-d / (sigma+tinny))
                } else {
                    sum += 1
                }
            }
            if (sum > log2k) {
                high = mid
                mid = (low + mid) / 2
            } else {
                low = mid
                if (high === Infinity) {
                    mid *= 2
                } else {
                    mid = (mid + high) / 2
                }
            }
            sigma = mid
        }
        n.rho = rho
        if (sigma < tinny) sigma = tinny
        n.sigma = sigma
        // compute edge weights based on the distances between points
        for (let i = 0; i < k; i++) {
            const d = nn[i].distance - rho
            let weight = 0
            if (d > 0) {
                weight = Math.exp(-d / sigma)
            } else {
                weight = 1
            }
            nn[i].weight = weight
        }
    }
    // Make the weights symmetric: w_ij = w_ji = w_ij + w_ji - w_ij * w_ji
    const edgeMap = new Map()
    for (let n of neighbors) {
        const i = n.index
        for (let nn of n.nn) {
            const j = nn.index
            const w_ij = nn.weight
            const key = i < j ? `${i}-${j}` : `${j}-${i}`
            if (!edgeMap.has(key)) {
                edgeMap.set(key, {source: i, target: j, distance: nn.distance, weight: w_ij})
            } else {
                const edge = edgeMap.get(key)
                edge.weight = edge.weight + w_ij - edge.weight * w_ij
            }
        }
    }
    return Array.from(edgeMap.values()) 

}

// Classic UMAP optimization
// Optimize the cross-entropy as in the classic implementation of UMAP, useing umap-learn as reference
function umapCrossEntropy(q, edges, a, b) {
    const vertices = new Array(q.length).fill(null).map((_, i) => ({index: i, x: q[i].x, y: q[i].y, r: radius, t: q[i].t}))
    const N = vertices.length
    const epsilon = 1e-4 // small value to avoid division by zero in the repulsive force computation
    const M = 5 // number of negative samples to draw for each attractive edge update
    const mxIterations = 500
    const disp = new Array(N).fill(null).map(() => ({x: 0, y: 0}))
    let lr = 1
    for (let iteration = 0; iteration < mxIterations; iteration++) {
        const alpha = lr * (1 - iteration / mxIterations)
        for (let e of edges) {
            const source = vertices[e.source]
            const target = vertices[e.target]
            const weight = e.weight
            const d = distance2D(source, target)
            const distanceSquared = Math.max(d.d ** 2, epsilon)
            const distancePower = distanceSquared ** (b - 1)
            const c = 2 * a * b * weight * distancePower / (1 + a * distanceSquared ** b)
            const dx = c * d.x * d.d
            const dy = c * d.y * d.d

            // hey, weighting twice with alpha! This is wrong
            disp[source.index].x += dx
            disp[source.index].y += dy
            disp[target.index].x -= dx
            disp[target.index].y -= dy
            // Negative sampling is tied to positive edges, not to vertices globally.
            for (let sample = 0; sample < M; sample++) {
                let randomIndex = source.index
                while (randomIndex === source.index || randomIndex === target.index) {
                    randomIndex = Math.floor(Math.random() * N)
                }
                const negative = vertices[randomIndex]
                const negDistance = distance2D(source, negative)
                const negDx = negDistance.x * negDistance.d
                const negDy = negDistance.y * negDistance.d
                const negD = Math.max(negDistance.d ** 2, epsilon)
                const cNeg = (weight / M) * (2 * b / (negD * (1 + a * negD ** b)))
                // Negative samples act as one-sided SGD updates for the source node.
                disp[source.index].x -= cNeg * negDx
                disp[source.index].y -= cNeg * negDy
            }
            // add a collision force to avoid points to be too close to each other in the low-dimensional space, which can
            const beta = 1.5 // two times the sum of the radii of the points is the distance at which the collision force starts to be applied
            const alpha = 0.5 //100 // strength of the collision force
            const eps = 0.01 // small value to avoid division by zero in the collision force computation
            const s = beta * (source.r + target.r)
            const r = d.d - s 
            const decay = 15
            if (r < 0) { 
                // if the distance between the points is less than the augmented sum of their radii, 
                // apply a repulsive force to push them apart
                const fr = (d.d > eps) ? alpha * s / d.d : alpha * s / eps
                disp[source.index].x -= fr * d.x
                disp[source.index].y -= fr * d.y
                disp[target.index].x += fr * d.x
                disp[target.index].y += fr * d.y
            } else if (r < s) {
                // if there is no collision, keep a weak repulsive force that decays quickly with distance
                const fr = alpha * Math.exp(-decay*r/s)
                disp[source.index].x -= fr * d.x
                disp[source.index].y -= fr * d.y
                disp[target.index].x += fr * d.x
                disp[target.index].y += fr * d.y
            } 
        }
        // update positions based on the computed forces
        for (let v of vertices) {
            // do not forget to multiply the forces by the learning rate to slow down the optimization process and allow it to converge to a steady state
            v.x += alpha * disp[v.index].x
            v.y += alpha * disp[v.index].y
            disp[v.index].x = 0
            disp[v.index].y = 0
        }
    }
    return vertices
}

// compute layout using UMAP, which is based on stochastic gradient descent to optimize the low-dimensional embedding
function conservativeForces(vertices, edges, lr, disp, a = 1, b = 1) {
    const N = vertices.length
    const epsilon = 1e-4 // small value to avoid division by zero in the repulsive force computation
    const M = 5 // number of negative samples to draw for each attractive edge update
    // for each edge update displacemnet vector
    for (let e of edges) {
        const source = vertices[e.source]
        const target = vertices[e.target]
        const weight = e.weight
        const d = distance2D(source, target)
        const distanceSquared = Math.max(d.d ** 2, epsilon)
        const distancePower = distanceSquared ** (b - 1)
        const c = 2 * a * b * weight * distancePower / (1 + a * distanceSquared ** b)
        const dx = c * d.x * d.d
        const dy = c * d.y * d.d

        disp[source.index].x += lr * dx
        disp[source.index].y += lr * dy
        disp[target.index].x -= lr * dx
        disp[target.index].y -= lr * dy
        // Negative sampling is tied to positive edges, not to vertices globally.
        for (let sample = 0; sample < M; sample++) {
            let randomIndex = source.index
            while (randomIndex === source.index || randomIndex === target.index) {
                randomIndex = Math.floor(Math.random() * N)
            }
            const negative = vertices[randomIndex]
            const negDistance = distance2D(source, negative)
            const negDx = negDistance.x * negDistance.d
            const negDy = negDistance.y * negDistance.d
            const negD = Math.max(negDistance.d ** 2, epsilon)
            const cNeg = (weight / M) * (2 * b / (negD * (1 + a * negD ** b)))
            // Negative samples act as one-sided SGD updates for the source node.
            disp[source.index].x -= lr * cNeg * negDx
            disp[source.index].y -= lr * cNeg * negDy
        }
    }
    // Apply collision forces to avoid points to be too close to each other in the low-dimensional space, which can cause 
    // numerical instability in the optimization process
    const beta = 1. // two times the sum of the radii of the points is the distance at which the collision force starts to be applied
    const alpha = 0.9 //100 // strength of the collision force
    const eps = 0.01 // small value to avoid division by zero in the collision force computation
    collisionForces(beta, alpha, eps, vertices, edges, disp)
}

// introduce a collision force to avoid points to be too close to each other in the low-dimensional space, which can 
// cause numerical instability in the optimization process
// Consider only vertices connected by an UMA edge
function collisionForces(beta, alpha, eps, vertices, edges,disp) {
    for (let e of edges) {
        const n1 = vertices[e.source]
        const n2 = vertices[e.target]
        const d = distance2D(n1, n2) // vector pointing from node n1 to node n2
        const s = beta * (n1.r + n2.r)
        const r = d.d - s 
        const decay = 15
        if (r < 0) { 
            // if the distance between the points is less than the augmented sum of their radii, 
            // apply a repulsive force to push them apart
            const fr = (d.d > eps) ? alpha * s / d.d : alpha * s / eps
            disp[n1.index].x -= fr * d.x
            disp[n1.index].y -= fr * d.y
            disp[n2.index].x += fr * d.x
            disp[n2.index].y += fr * d.y
        } else if (r < s) {
            // if there is no collision, keep a weak repulsive force that decays quickly with distance
            const fr = alpha * Math.exp(-decay*r/s)
            disp[n1.index].x -= fr * d.x
            disp[n1.index].y -= fr * d.y
            disp[n2.index].x += fr * d.x
            disp[n2.index].y += fr * d.y
        } 
    }
}

function initUMAP({ nPoints = 1000, noise = 0.1, k = 15, minDist = 0.1, spread = 1, initialization = 'random' } = {}) {
    const data = generateSwissRoll(nPoints, noise)
    const {q, p, neighbors, edges} = computeNetwork(data, k, initialization)
    const { a, b } = computeABParams(minDist, spread)
    //console.log(data)
    return {
        q: q,
        p: p,
        neighbors,
        edges,
        Q_SIZE,
        minDist,
        spread,
        initialization,
        a,
        b
    }
}

// export the functions to be used in the visualization
export {
    initUMAP,
    conservativeForces,
    computeABParams,
    umapCrossEntropy
}