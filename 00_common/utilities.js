const tinny = 1e-9
export function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}
export function cross(v1, v2) {
    return {
        x: (v1.y * v2.z - v1.z * v2.y),
        y: (v1.z * v2.x - v1.x * v2.z),
        z: (v1.x * v2.y - v1.y * v2.x)
    }
}
export function norm(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
}
export function norm2(v) {
    return v.x ** 2 + v.y ** 2 + v.z ** 2
}
export function normalize(v) {
    const s = norm(v)
    if (s < tinny) {
        return { x: 0, y: 0, z: 0 }
    } else {
        return { x: v.x / s, y: v.y / s, z: v.z / s }
    }
}
export function dot2D(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y
}
export function norm2D(v) {
    return Math.sqrt(v.x ** 2 + v.y ** 2)
}
export function normalize2D(v) {
    const s = norm2D(v)
    if (s < tinny) {
        return { x: 0, y: 0 }
    } else {
        return { x: v.x / s, y: v.y / s }
    }
}

// non-normalized
export function normal(v0, v1, v2) {
    const e0 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z }
    const e1 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z }
    return cross(e0, e1)
}
export function keyGen(k1, k2) {
    if (k1 > k2) {
        return (BigInt(k1) << 32n) | BigInt(k2)
    }
    else {
        return (BigInt(k2) << 32n) | BigInt(k1)
    }
}
// Cantor pairing function
export function keyCantor(k1, k2) {
    if (k1 > k2) {
      return (k1+k2)*(k1+k2+1)/2 + k2
    }
    else {
      return (k1+k2)*(k1+k2+1)/2 + k1
    }
}

export function isObject(obj) {
    return obj && typeof obj === 'object' && obj.constructor === Object
}

// Transition to a simplified interface for 2D and 3D geometry to ML typical vector matrix operations
// Linear algebra utilities for ML algorithms, with a focus on 2D and 3D vectors. 
// This is not a full linear algebra library, but provides the basic operations needed for the course.
export const Vec = {
    // Basic vector operations
    add: (a, b) => a.map((x, i) => x + b[i]),
    sub: (a, b) => a.map((x, i) => x - b[i]),
    scale: (v, s) => v.map(x => x * s),
    dot: (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0),
    
    // L2 Norm (Euclidean length)
    norm: (v) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)),
    
    // Avoid unnecessary Math.sqrt() calls
    normSq: (v) => v.reduce((sum, x) => sum + x * x, 0),

    // Returns a unit vector (length of 1)
    normalize: (v) => {
        const n = Vec.norm(v);
        return n > 0 ? Vec.scale(v, 1 / n) : v;
    },
    
    // The projection of vector 'v' onto vector 'onto'
    project: (v, onto) => {
        const d = Vec.dot(onto, onto)
        if (d === 0) return onto.map(() => 0)
        const scalar = Vec.dot(v, onto) / d
        return Vec.scale(onto, scalar)
    },

    // The component of 'v' perpendicular to 'onto'
    reject: (v, onto) => Vec.sub(v, Vec.project(v, onto))
}

export const Mat = {
    // Matrix * Vector = Vector
    multVec: (A, v) => {
        // Each element of the resulting vector is the dot product 
        // of a matrix row and the input vector.
        return A.map(row => Vec.dot(row, v))
    },

    // Matrix * Matrix = Matrix
    multMat: (A, B) => {
        // To multiply A and B, we need the columns of B
        const colsB = B[0].map((_, colIdx) => B.map(row => row[colIdx]))
        
        return A.map(rowA => 
            colsB.map(colB => Vec.dot(rowA, colB))
        )
    },

    // sometime needed 
    transpose: (M) => M[0].map((_, i) => M.map(row => row[i]))
}

// Geometric utilities for 2D points, useful for teaching and visualization.
export const Geom = {
    // Interface bridge: {x, y} <-> [x, y]
    pointToVec2: (p) => [p.x, p.y],
    pointToVec3: (p) => [p.x, p.y, p.z || 0],
    vecToPoint2: (v) => ({ x: v[0], y: v[1] }),
    vecToPoint3: (v) => ({ x: v[0], y: v[1], z: v[2] }),

    // Useful for teaching: Euclidean distance between points
    dist2: (p1, p2) => Vec.mag(Vec.sub(Geom.pointToVec2(p1), Geom.pointToVec2(p2))),
    dist3: (p1, p2) => Vec.mag(Vec.sub(Geom.pointToVec3(p1), Geom.pointToVec3(p2)))
}
