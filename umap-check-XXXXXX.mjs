import { kdTreeFactory } from './00_common/kdTree.js'

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
// For performance intoruce an Euclidean distance for the low-dimensional space, which is used in the optimization 
// process of the UMAP layout. Compute the direction from n1 to n2, and the distance between them, which is used to 
// compute the forces between points in the low-dimensional space.
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

function checkIndex(knn, index) {
    return knn.some(n => n.index === index);
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
function computeNetwork(vertices, k = 15) {
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

    // compute vertices for the low-dimensional embedding, initialize them randomly in a 2D space
    const q = new Array(vertices.length).fill(null).map(() => ({index: -1, x: 0, y: 0, r: 0}))
    for (let v of vertices) {
        q[v.index].x = Q_SIZE * (Math.random() - 0.5)
        q[v.index].y = Q_SIZE * (Math.random() - 0.5)
        q[v.index].index = v.index
        q[v.index].r = radius
        q[v.index].t = v.t // Use 't' for color mapping to see the "unrolling" in the low-dimensional space
    }

    return {
        q: q,
        p: vertices,
        neighbors,
        edges
    }
}

// UMAP uses a fuzzy set representation of the data, where the similarity between points is represented as a probability. 
// The edge weights in the graph are computed based on the distances between points in the high-dimensional space, and 
// these weights are used to construct a low-dimensional embedding that preserves the local structure of the data.
function computeEdges(neighbors) {
    for (let n of neighbors) {
        const nn = n.nn
        const k = nn.length
        const rho = nn[0].distance // distance to the closest neighbor
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

// compute layout using UMAP, which is based on stochastic gradient descent to optimize the low-dimensional embedding
function conservativeForces(vertices, edges, lr, disp) {
    const N = vertices.length
    const epsilon = 1e-4 // small value to avoid division by zero in the repulsive force computation
    const M = 5 // number of negative samples to draw for each attractive edge update
    // for each edge update displacemnet vector
    for (let e of edges) {
        const source = vertices[e.source]
        const target = vertices[e.target]
        const weight = e.weight
        const d = distance2D(source, target)
        const c = 2 * weight / (1 + d.d ** 2) // scale attraction using the current low-dimensional distance
        const dx = c * (target.x - source.x)
        const dy = c * (target.y - source.y)

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
            const negDx = negative.x - source.x
            const negDy = negative.y - source.y
            const negD = negDx ** 2 + negDy ** 2
            const cNeg = 2 / ((negD + epsilon) * (1 + negD))
            disp[source.index].x -= lr * cNeg * negDx
            disp[source.index].y -= lr * cNeg * negDy
            disp[negative.index].x += lr * cNeg * negDx
            disp[negative.index].y += lr * cNeg * negDy
        }
    }
    // Apply collision forces to avoid points to be too close to each other in the low-dimensional space, which can cause 
    // numerical instability in the optimization process
    const beta = 1 // two times the sum of the radii of the points is the distance at which the collision force starts to be applied
    const alpha = 1//100 // strength of the collision force
    const eps = 0.1 // small value to avoid division by zero in the collision force computation
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
        const decay = 10 * Q_SIZE
        if (r < 0) { 
            // if the distance between the points is less than the augmented sum of their radii, 
            // apply a repulsive force to push them apart
            const fr = (d.d > eps) ? alpha * s / d.d : alpha * s / eps
            disp[n1.index].x -= fr * d.x
            disp[n1.index].y -= fr * d.y
            disp[n2.index].x += fr * d.x
            disp[n2.index].y += fr * d.y
        } else {
            // if the distance between the points is greater than the augmented sum of their radii, 
            // apply a weak attractive force to keep them together
            const fa = alpha * Math.exp(-decay*(s - d.d)**2)
            disp[n1.index].x -= fa * d.x
            disp[n1.index].y -= fa * d.y
            disp[n2.index].x += fa * d.x
            disp[n2.index].y += fa * d.y
        }
    }
}

function initUMAP() {
    const data = generateSwissRoll(1000, 0.1)
    const {q, p, neighbors, edges} = computeNetwork(data)
    //console.log(data)
    return {
        q: q,
        p: p,
        neighbors,
        edges,
        Q_SIZE
    }
}

// export the functions to be used in the visualization
export {
    initUMAP,
    conservativeForces
}