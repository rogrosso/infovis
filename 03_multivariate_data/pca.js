import { Vec, Mat, Geom, keyCantor } from 'utilities'
import { mwcRandomFactory } from 'random'

const rnd = mwcRandomFactory(23)

// Compute mean and covariance matrix of the data
function computeCovarianceMatrix(data) {
    const nrSamples = data.length
    const dim = data[0] ? Object.keys(data[0]).length : 0
    // compute mean
    const mean = new Array(dim).fill(0)
    for (const point of data) {
        for (let i = 0; i < dim; i++) {
            mean[i] += point[i]
        }
    }
    for (let i = 0; i < dim; i++) mean[i] /= nrSamples

    // create covariance matrix and fill it
    const covarianceMatrix = Array.from({ length: dim }, () => Array(dim).fill(0))
    for (const point of data) {
        for (let i = 0; i < dim; i++) {
            for (let j = 0; j < dim; j++) {
                covarianceMatrix[i][j] += (point[i] - mean[i]) * (point[j] - mean[j])
            }
        }
    }
    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            covarianceMatrix[i][j] /= nrSamples - 1
        }
    }
    return covarianceMatrix
}

function gramSchmidt(v1, v2) {
    // first axis
    const e1 = Vec.normalize(v1)

    // orthogonalize the second axis to the first
    const projection = Vec.dot(v2, e1)
    const v2_orthogonal = Vec.sub(v2, Vec.scale(e1, projection))
    const e2 = Vec.normalize(v2_orthogonal)

    return [e1, e2]
} 

// Block power iteration method to find the top two eigenvectors of the covariance matrix
function pcaBlockIteration(covarianceMatrix, maxIterations = 100, tolerance = 1e-6) {
    const n = covarianceMatrix.length
    
    // 1. Initialize two random vectors
    let v1 = Array.from({length: n}, () => rnd() - 0.5) // Random values between -0.5 and 0.5
    let v2 = Array.from({length: n}, () => rnd() - 0.5) // Random values between -0.5 and 0.5
    v2 = Vec.reject(v2, v1) // Make v2 orthogonal to v1
    v1 = Vec.normalize(v1)
    v2 = Vec.normalize(v2)

    let prevV1 = [...v1]
    let prevV2 = [...v2]
    for (let i = 0; i < maxIterations; i++) {
        // 2. Power step: Multiply by Covariance Matrix
        v1 = Mat.multVec(covarianceMatrix, v1)
        v2 = Mat.multVec(covarianceMatrix, v2)

        // 3. Gram-Schmidt Orthonormalization
        ;([v1, v2] = gramSchmidt(v1, v2));

        // 4. Check for convergence (optional)
        // You can check the change in v1 and v2 or the change in the explained variance
        const changeV1 = Vec.norm(Vec.sub(v1, prevV1))
        const changeV2 = Vec.norm(Vec.sub(v2, prevV2))
        if (changeV1 < tolerance && changeV2 < tolerance) {
            break; // Converged
        }
        prevV1 = [...v1]
        prevV2 = [...v2]
    }
    return [v1, v2]; // These are your top two eigenvectors
}


// Compute the PCA of the data and return the projected data onto the top two eigenvectors
export function pca(data) {
    // 1. Compute the covariance matrix of the data
    const covarianceMatrix = computeCovarianceMatrix(data)

    // 2. Use the block power iteration method to find the top nComponents eigenvectors
    const [eigenvector1, eigenvector2] = pcaBlockIteration(covarianceMatrix)

    // 3. Project the original data onto the new eigenvector basis
    const projectedData = data.map(point => {
        const scale1 = Vec.dot(point, eigenvector1)
        const scale2 = Vec.dot(point, eigenvector2)
        return [Vec.scale(eigenvector1, scale1), Vec.scale(eigenvector2, scale2)]
    })
    
    return projectedData
}

