import { kdTree } from 'kdTree'


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
            coords: [nx, ny, nz],
            t: t, // Use 't' for color mapping to see the "unrolling"
            id: i
        });
    }
    return data;
}


function biuildKdTree(target, depth = 0) {
    const points = []
    if (points.length === 0) {
        return null
    }

    for (let v of target.vertices) {
        points.push({
            index: v.index,
            x: v.x,
            y: v.y,
            z: v.z
        })
    }
    return kdTreeFactory(points) 
}

// Euclidean distance function for 3D points
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computeEdges(target, k = 5) {
    const tree = biuildKdTree(target)
    const edges = []
    for (let v of target.vertices) {
        const neighbors = tree.nearest({x: v.x, y: v.y, z: v.z}, k + 1) // +1 to include the point itself
        for (let i = 1; i < neighbors.length; i++) { // Start from 1 to skip the point itself
            const neighbor = neighbors[i][0]
            edges.push({
                source: v.index,
                target: neighbor.index,
                weight: 0
            })
        }
    }
    return edges
}

// UMAP uses a fuzzy set representation of the data, where the similarity between points is represented as a probability. 
// The edge weights in the graph are computed based on the distances between points in the high-dimensional space, and 
// these weights are used to construct a low-dimensional embedding that preserves the local structure of the data.
function computeEgeWeights(edges) {
    for (let edge of edges) {
        console.log(edge)
    }

}