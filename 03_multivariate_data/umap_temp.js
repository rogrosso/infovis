import { kdTreeFactory } from 'kdTree'
import { keyCantor } from 'utilities'

import { mwcRandomFactory } from 'random'

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
    const rnd = mwcRandomFactory(23)
    const data = []
    for (let i = 0; i < nPoints; i++) {
        // t determines the position along the spiral
        const t = 1.5 * Math.PI * (1 + 2 * rnd())
        // w determines the width (the height of the roll)
        const w = 20 * rnd()

        const x = t * Math.cos(t)
        const y = w
        const z = t * Math.sin(t)

        // Add some Gaussian-like noise
        const nx = x + (rnd() - 0.5) * noise
        const ny = y + (rnd() - 0.5) * noise
        const nz = z + (rnd() - 0.5) * noise

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
// Compute the direction from n1 to n2, and the distance between them.
// In case of zero distance, introduce a small random perturbation to avoid numerical instability in the optimization process.
const d_rnd = mwcRandomFactory(10)
function distance2D(n1, n2) {
    let dx = n2.x - n1.x
    let dy = n2.y - n1.y
    let d = Math.sqrt(dx * dx + dy * dy)
    if (d === 0) {
        dx = (d_rnd() - 0.5) * 1e-4
        dy = (d_rnd() - 0.5) * 1e-4
        d = Math.sqrt(dx * dx + dy * dy)
    }
    return { x: dx / d, y: dy / d, d: d }
}

function targetSimilarity(d, minDist, spread) {
    if (d <= minDist) return 1
    return Math.exp(-(d - minDist) / spread)
}

function lowDimSimilarity(distance, a, b) {
    return 1 / (1 + a * distance ** (2 * b))
}

function fitTargetSimilarity(minDist = 0.1, spread = 1) {
    const minD_ = Math.max(0, minDist)
    const spread_ = Math.max(spread, 1e-4)
    const maxD_ = Math.max(3 * spread_ + minD_, 1)
    const nrSamples = 300
    // generate sample distances
    const distances = new Array(nrSamples).fill(null).map((_, i) => i / (nrSamples - 1) * maxD_)
    const targets = distances.map(d => targetSimilarity(d, minD_, spread_))
    
    // error functional
    function error(d, t, a, b) {
        let error = 0
        const nr_ = d.length
        for (let i = 0; i < nr_; i++) {
            const diff = lowDimSimilarity(d[i], a, b) - t[i]    
            error += diff * diff
        }
        return error
    }
    // grid search for a and b
    let a_ = 1
    let b_ = 1
    let e_ = Infinity
    // Search range for a: [0.01, 100], logarithmic scale: [-2, 2]
    // Search range for b: [0.25, 3]
    const aValues = new Array(25).fill(null).map((_, i) => 10 ** (-2 + 4 * i / 24))
    const bValues = new Array(24).fill(null).map((_, i) => 0.25 + 2.75 * i / 23)
    for (let a of aValues) {
        for (let b of bValues) {
            const e = error(distances, targets, a, b)
            if (e < e_) {
                a_ = a
                b_ = b
                e_ = e
            }
        }
    }
    // Refine search around the best values found in the coarse search
    const aValuesRefined = new Array(41).fill(null).map((_, i) => 10 ** (Math.log10(a_) - 0.5 + i / 40))
    const bValuesRefined = new Array(41).fill(null).map((_, i) => Math.max(0.05, b_ - 0.5) + 1 * i / 40)
    for (let a of aValuesRefined) {
        for (let b of bValuesRefined) {
            const e = error(distances, targets, a, b)
            if (e < e_) {
                a_ = a
                b_ = b
                e_ = e
            }
        }
    }

    return { a: a_, b: b_ }
}

function normalize(v) {
    let sz_ = 0
    for (let e of v) sz_ += e * e
    sz_ = Math.sqrt(sz_)
    if (sz_ < 1e-12) {
        return v.map(() => 0)
    } else {
        for (let i = 0; i < v.length; i++) v[i] /= sz_
    }
}
function dot(v1, v2) {
    let d = 0
    for (let i = 0; i < v1.length; i++) d += v1[i] * v2[i]
    return d
}

function spectralEmbedding(vertices, edges) {
    // compute M = I - D^(-1/2) A D^(-1/2), where A is the adjacency matrix and D is the degree matrix
    const nr_ = vertices.length
    // compute the degree of matrix
    const D = new Array(nr_).fill(0)
    for (let e of edges) {
        D[e.source] += e.weight
        D[e.target] += e.weight
    }
    // compute the normalized adjacency matrix D^(-1/2) A D^(-1/2)
    // use a sparse representation
    const w = new Array(nr_).fill(null).map(() => [])
    for (let e of edges) {
        const w_ij = e.weight / Math.sqrt(D[e.source] * D[e.target])
        w[e.source].push({ index: e.target, weight: w_ij })
        w[e.target].push({ index: e.source, weight: w_ij })
    }
    // compute the first fixed eigenvector of M with eigenvalue 1
    const v0 = new Array(nr_).fill(0).map((_, i) => Math.sqrt(D[i]))  
    normalize(v0)

    // initialize eigenvectors with seeded random values to ensure reproducibility
    const rnd = mwcRandomFactory(42)
    const v1 = new Array(nr_).fill(0).map(() => (rnd()-0.5))
    const v2 = new Array(nr_).fill(0).map(() => (rnd()-0.5))
    normalize(v1)
    normalize(v2)

    // power iteration to compute the second and third eigenvectors
    const mv1 = new Array(nr_).fill(0)
    const mv2 = new Array(nr_).fill(0)
    const maxIterations = 500
    let iter = 0
    let error = 1
    const epsilon = 1e-6
    while (iter++ < maxIterations && error > epsilon) {
        // compute M v1 and M v2
        for (let i = 0; i < nr_; i++) {
            for (let n of w[i]) {
                mv1[i] += n.weight * v1[n.index]
                mv2[i] += n.weight * v2[n.index]
            }
        }
        // orthogonalize to v0
        const dot1 = dot(mv1, v0)
        const dot2 = dot(mv2, v0)
        for (let i = 0; i < nr_; i++) {
            mv1[i] -= dot1 * v0[i]
            mv2[i] -= dot2 * v0[i]
        }
        // orthogonalize to each other
        const dot12 = dot(mv1, mv2)
        const dot11 = dot(mv1, mv1)
        for (let i = 0; i < nr_; i++) {
            mv2[i] -= dot12 / dot11 * mv1[i]
        }
        // normalize
        normalize(mv1)
        normalize(mv2)
        // error is the sum of the changes in the eigenvectors
        let err1 = 0
        let err2 = 0
        for (let i = 0; i < nr_; i++) {
            err1 += (mv1[i] - v1[i]) ** 2
            err2 += (mv2[i] - v2[i]) ** 2
            v1[i] = mv1[i]
            v2[i] = mv2[i]
            mv1[i] = 0
            mv2[i] = 0
        }
        error = Math.max(err1, err2)
    }
    
    // denormalize the eigenvectors to have the same scale as the original data
    for (let i = 0; i < nr_; i++) {
        v1[i] /= Math.sqrt(D[i])
        v2[i] /= Math.sqrt(D[i])
    
    }
    // scale to fit in the Q_SIZE
    // 1. center the data at the origin
    // 2. scale to fit in the Q_SIZE
    let maxx = -Infinity
    let minx = Infinity
    let maxy = -Infinity
    let miny = Infinity
    for (let i = 0; i < nr_; i++) {
        if (v1[i] > maxx) maxx = v1[i]
        if (v1[i] < minx) minx = v1[i]
        if (v2[i] > maxy) maxy = v2[i]
        if (v2[i] < miny) miny = v2[i]
    }
    const centerx = (maxx + minx) / 2
    const centery = (maxy + miny) / 2
    const maxSz = Math.max(maxx - minx, maxy - miny)
    const distWall = 5 * radius
    const s_ = (Q_SIZE - distWall) / Math.max(maxSz, 1e-12)
    for (let i = 0; i < nr_; i++) {
        v1[i] = (v1[i] - centerx) * s_
        v2[i] = (v2[i] - centery) * s_
    }

    // return the embedding as an array of points with x and y coordinates
    return new Array(nr_).fill(null).map((_, i) => ({index: i, x: v1[i], y: v2[i], r: radius, t: vertices[i].t}))
}
// =====================================================================
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
    const rnd = mwcRandomFactory(1997)
    const q = new Array(vertices.length).fill(null).map(() => ({index: -1, x: 0, y: 0, r: 0}))
    for (let v of vertices) {
        q[v.index].x = Q_SIZE * (rnd() - 0.5)
        q[v.index].y = Q_SIZE * (rnd() - 0.5)
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

    // measure time
    const startTime = performance.now()
    const q = spectralEmbedding(vertices, edges)
    const endTime = performance.now()
    console.log(`Spectral embedding computed in ${(endTime - startTime).toFixed(2)} ms`)
    // second method
    const startTime2 = performance.now()
    const q1 = createInitialEmbedding(vertices, edges, initialization)
    const endTime2 = performance.now()
    console.log(`Initial embedding computed in ${(endTime2 - startTime2).toFixed(2)} ms`)

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
function computeSigma(nn, rho) {
    const k = nn.length
    const log2k = Math.log2(k)
    const tinny = 1e-14
    const epsilon = 1e-5
    let low = 0
    let high = Infinity
    let mid = 1
    while (Math.abs(high - low) > epsilon) {
        // compute the sum of the probabilities for the current sigma
        let sum = 0
        for (let n of nn) {
            const d = n.distance - rho
            sum += Math.exp(-Math.max(0, d) / (mid + tinny))
        }
        if (sum > log2k) {
            high = mid
            mid = (low + mid) / 2
        } else {
            low = mid
            // guard: high sitll at infinity, we need to increase mid exponentially to find an upper bound
            if (high === Infinity) {
                mid *= 2
            } else {
                mid = (mid + high) / 2
            }
        }
    }
    
    if (mid < tinny) return tinny
    else return mid
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
        // compute weights
        for (let n of nn) {
            const d = n.distance - rho
            n.weight = Math.exp(-Math.max(0, d) / sigma)
        }
        nn.rho = rho
        nn.sigma = sigma
    }
    // Symmetrize the weights: w_ij = w_ji = w_ij + w_ji - w_ij * w_ji
    // Compute unique weighted edges 
    const edgeMap = new Map()
    for (let n of neighbors) {
        const i = n.index
        for (let nn of n.nn) {
            const j = nn.index
            const w_ij = nn.weight
            const key = keyCantor(i, j)
            if (!edgeMap.has(key)) { // the edge has not been added yet, add it with the current weight
                edgeMap.set(key, {source: i, target: j, distance: nn.distance, weight: w_ij})
            } else { // the edge already exists, update the weight using the formula w_ij = w_ij + w_ji - w_ij * w_ji
                const edge = edgeMap.get(key)
                edge.weight = edge.weight + w_ij - edge.weight * w_ij
            }
        }
    }
    // return the unique edges as an array
    return Array.from(edgeMap.values()) 
}

// Classic UMAP optimization
// Optimize the cross-entropy as in the classic implementation of UMAP, useing umap-learn as reference
const rnd_ = mwcRandomFactory(18)
function umapCrossEntropy(q, edges, a, b) {
    const vertices = new Array(q.length).fill(null).map((_, i) => ({index: i, x: q[i].x, y: q[i].y, r: radius, t: q[i].t}))
    const N = vertices.length
    const epsilon = 1e-4 // small value to avoid division by zero in the repulsive force computation
    const M = 5 // number of negative samples to draw for each attractive edge update
    const mxIterations = 600
    const disp = new Array(N).fill(null).map(() => ({x: 0, y: 0}))
    let lr = 1
    for (let iteration = 0; iteration < mxIterations; iteration++) {
        // process all positive edges, positive means the attractive forces
        umapForces(vertices, edges, a, b, disp)
        collision(1.1, 0.01, 0.01, vertices, edges, disp)
        // update positions based on the computed forces
        const llr = lr * (1 - iteration / mxIterations) // linear learning rate decay
        for (let v of vertices) {
            // do not forget to multiply the forces by the learning rate to slow down the optimization process and allow it to converge to a steady state
            v.x += llr * disp[v.index].x
            v.y += llr * disp[v.index].y
            //v.x += disp[v.index].x
            //v.y += disp[v.index].y
            disp[v.index].x = 0
            disp[v.index].y = 0
        }
    }
    return vertices
}

function umapForces(vertices, edges, a, b, disp) {
    const N = vertices.length
    const M = 5
    const epsilon = 1e-4 // small value to avoid division by zero in the repulsive force computation
    for (let e of edges) {
        const source = vertices[e.source]
        const target = vertices[e.target]
        const weight = e.weight
        const d = distance2D(source, target)
        const fa = 2 * a * b * weight * d.d**(2*b-1) / (1 + a * d.d**(2 * b))

        // hey, weighting twice with alpha! This is wrong
        disp[source.index].x += fa * d.x
        disp[source.index].y += fa * d.y
        disp[target.index].x -= fa * d.x
        disp[target.index].y -= fa * d.y

        // For each positive edge, randomly select M negative samples and apply repulsive forces to the source node 
        for (let sample = 0; sample < M; sample++) {
            let randomIndex = Math.floor(rnd_() * N) //source.index
            // choose sample distinct from source and target
            while (randomIndex === source.index || randomIndex === target.index) {
                randomIndex = Math.floor(rnd_() * N)
            }
            const dist = distance2D(source, vertices[randomIndex]) // negative distance
            //const fr = (weight/M) * 2 * b / (Math.max(dist.d,epsilon) * (1 + a * dist.d ** (2 * b)))
            const fr = (weight / M) * (2 * b / ((dist.d**2 + epsilon) * (1 + a * dist.d ** (2 * b))))
            disp[source.index].x -= fr * dist.x * dist.d
            disp[source.index].y -= fr * dist.y * dist.d
        }
    }
}

function collision(beta, alpha, eps, vertices, edges, disp) {
    const N = vertices.length
    for (let e of edges) {
        const n1 = vertices[e.source]
        const n2 = vertices[e.target]
        const d = distance2D(n1, n2)
        const fr = alpha / (d.d**2 + eps)
        disp[n1.index].x -= fr * d.x
        disp[n1.index].y -= fr * d.y
        disp[n2.index].x += fr * d.x
        disp[n2.index].y += fr * d.y
    }
}

function initUMAP({ nPoints = 1000, noise = 0.1, k = 15, minDist = 0.1, spread = 1, initialization = 'random' } = {}) {
    const data = generateSwissRoll(nPoints, noise)
    const {q, p, neighbors, edges} = computeNetwork(data, k, initialization)
    const { a, b } = fitTargetSimilarity(minDist, spread)
    
    return {
        q: q,
        p: p,
        neighbors,
        edges,
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
    collision,
    umapCrossEntropy,
    umapForces
}