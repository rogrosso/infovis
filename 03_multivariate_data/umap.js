import { kdTreeFactory } from 'kdTree'


// Data set Swiss Roll
function generateSwissRoll(nPoints = 500, noise = 0.05) {
    const data = [];
    for (let i = 0; i < nPoints; i++) {
        // t determines the position along the spiral
        const t = 1.5 * Math.PI * (1 + 2 * Math.random()); 
        // w determines the width (the height of the roll)
        const w = 20 * Math.random(); 

        const x = t * Math.cos(t);
        const y = w;
        const z = t * Math.sin(t);

        // Add some Gaussian-like noise
        const nx = x + (Math.random() - 0.5) * noise;
        const ny = y + (Math.random() - 0.5) * noise;
        const nz = z + (Math.random() - 0.5) * noise;

        data.push({
            x: nx, // use naming convention for points used in kd-tree
            y: ny,
            z: nz,
            t: t, // Use 't' for color mapping to see the "unrolling"
            index: i
        });
    }
    return data;
}

// Euclidean distance function for 3D points
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computeNetwork(vertices, k = 15) {
    const kdTree = kdTreeFactory(vertices, distance)
    // compute edges based on the k nearest neighbors
    const neighbors = new Array(k).fill(null).map(() => [])
    for (let v of vertices) {
        const knn = kdTree.knn(v, k + 1) // +1 to include the point itself
        for (let i = 1; i < knn.length; i++) { // Start from 1 to skip the point itself
            // update neighbors with the k nearest neighbors
            // using squared distance in kd-tree, so take the square root for actual distance
            neighbors[i].push({index: v.index, distance: Math.sqrt(knn[i].distance)}) 
        }
    }
    // compute edge weights based on the distances between points
    const edges = computeEdges(vertices,neighbors)

    return {
        vertices,
        neighbors,
        edges
    }
}

// UMAP uses a fuzzy set representation of the data, where the similarity between points is represented as a probability. 
// The edge weights in the graph are computed based on the distances between points in the high-dimensional space, and 
// these weights are used to construct a low-dimensional embedding that preserves the local structure of the data.
function computeEgeWeights(vertices, neighbors) {
    for (let n of neighbors) {
        const k = n.length
        const rho = Math.max(0, n[0].distance) // distance to the closest neighbor
    }

}

function init() {
    const data = generateSwissRoll(1000, 0.1)
    const network = computeNetwork(data)
    //console.log(data)
    return network.vertices
}

// export the functions to be used in the visualization
export {
    init,
    computeNetwork,
    computeEgeWeights
}