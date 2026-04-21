const tinny = 1e-9

/*
 * Math helper layout used across the course code:
 * - Vec: preferred array-based linear algebra API for ML and numerical code.
 * - Mat: preferred matrix operations built on Vec.
 * - Geom: preferred point-based geometry API for 2D/3D visualization code.
 * - Legacy top-level helpers below are kept only for compatibility with older examples.
 *   New code should prefer Vec, Mat, and Geom directly.
 */

export function dot(v1, v2) {
    return Vec.dot(Geom.pointToVec3(v1), Geom.pointToVec3(v2))
}
export function cross(v1, v2) {
    return {
        x: (v1.y * v2.z - v1.z * v2.y),
        y: (v1.z * v2.x - v1.x * v2.z),
        z: (v1.x * v2.y - v1.y * v2.x)
    }
}
export function norm(v) {
    return Vec.norm(Geom.pointToVec3(v))
}
export function norm2(v) {
    return Vec.normSq(Geom.pointToVec3(v))
}
export function normalize(v) {
    return Geom.vecToPoint3(Vec.normalize(Geom.pointToVec3(v)))
}
export function dot2D(v1, v2) {
    return Vec.dot(Geom.pointToVec2(v1), Geom.pointToVec2(v2))
}
export function norm2D(v) {
    return Vec.norm(Geom.pointToVec2(v))
}
export function normalize2D(v) {
    return Geom.vecToPoint2(Vec.normalize(Geom.pointToVec2(v)))
}

// non-normalized
export function normal(v0, v1, v2) {
    const e0 = Geom.delta3(v0, v1)
    const e1 = Geom.delta3(v0, v2)
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

// Linear algebra utilities for ML algorithms, with a focus on dense array-based vectors.
export const Vec = {
    // Basic vector operations
    add: (a, b) => a.map((x, i) => x + b[i]),
    sub: (a, b) => a.map((x, i) => x - b[i]),
    scale: (v, s) => v.map(x => x * s),
    dot: (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0),
    
    // L2 Norm (Euclidean length)
    norm: (v) => Math.hypot(...v),
    
    // Avoid unnecessary Math.sqrt() calls
    normSq: (v) => v.reduce((sum, x) => sum + x * x, 0),

    // Returns a unit vector (length of 1)
    normalize: (v) => {
        const n = Vec.norm(v);
        return n > tinny ? Vec.scale(v, 1 / n) : v.map(() => 0)
    },

    normalizeInPlace: (v) => {
        const n = Vec.norm(v)
        if (n > tinny) {
            for (let i = 0; i < v.length; i++) v[i] /= n
        } else {
            for (let i = 0; i < v.length; i++) v[i] = 0
        }
        return v
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

function jitterVector(dimension, jitter = undefined, jitterScale = 1e-4) {
    const rnd = jitter || Math.random
    return new Array(dimension).fill(0).map(() => (rnd() - 0.5) * jitterScale)
}

// Geometric utilities for 2D/3D points, built on top of Vec for consistency.
export const Geom = {
    // Interface bridge: {x, y} <-> [x, y]
    pointToVec2: (p) => [p.x, p.y],
    pointToVec3: (p) => [p.x, p.y, p.z || 0],
    vecToPoint2: (v) => ({ x: v[0], y: v[1] }),
    vecToPoint3: (v) => ({ x: v[0], y: v[1], z: v[2] }),

    // Differences between points in geometric coordinates.
    delta2: (p1, p2) => Geom.vecToPoint2(Vec.sub(Geom.pointToVec2(p2), Geom.pointToVec2(p1))),
    delta3: (p1, p2) => Geom.vecToPoint3(Vec.sub(Geom.pointToVec3(p2), Geom.pointToVec3(p1))),

    // Useful for teaching: Euclidean distance between points.
    dist2Sq: (p1, p2) => Vec.normSq(Vec.sub(Geom.pointToVec2(p2), Geom.pointToVec2(p1))),
    dist2: (p1, p2) => Vec.norm(Vec.sub(Geom.pointToVec2(p2), Geom.pointToVec2(p1))),
    dist3Sq: (p1, p2) => Vec.normSq(Vec.sub(Geom.pointToVec3(p2), Geom.pointToVec3(p1))),
    dist3: (p1, p2) => Vec.norm(Vec.sub(Geom.pointToVec3(p2), Geom.pointToVec3(p1))),

    direction2: (p1, p2, jitter = undefined, jitterScale = 1e-4) => {
        let delta = Vec.sub(Geom.pointToVec2(p2), Geom.pointToVec2(p1))
        if (Vec.normSq(delta) < tinny * tinny) {
            delta = jitterVector(2, jitter, jitterScale)
        }
        return Geom.vecToPoint2(Vec.normalize(delta))
    },

    direction3: (p1, p2, jitter = undefined, jitterScale = 1e-4) => {
        let delta = Vec.sub(Geom.pointToVec3(p2), Geom.pointToVec3(p1))
        if (Vec.normSq(delta) < tinny * tinny) {
            delta = jitterVector(3, jitter, jitterScale)
        }
        return Geom.vecToPoint3(Vec.normalize(delta))
    },

    directionDist2: (p1, p2, jitter = undefined, jitterScale = 1e-4) => {
        let delta = Vec.sub(Geom.pointToVec2(p2), Geom.pointToVec2(p1))
        if (Vec.normSq(delta) < tinny * tinny) {
            delta = jitterVector(2, jitter, jitterScale)
        }
        const d = Vec.norm(delta)
        return { ...Geom.vecToPoint2(Vec.scale(delta, 1 / d)), d }
    },

    directionDist3: (p1, p2, jitter = undefined, jitterScale = 1e-4) => {
        let delta = Vec.sub(Geom.pointToVec3(p2), Geom.pointToVec3(p1))
        if (Vec.normSq(delta) < tinny * tinny) {
            delta = jitterVector(3, jitter, jitterScale)
        }
        const d = Vec.norm(delta)
        return { ...Geom.vecToPoint3(Vec.scale(delta, 1 / d)), d }
    },

    scalarProjection2: (origin, axis, point) => Vec.dot(
        Geom.pointToVec2(Geom.delta2(origin, point)),
        Geom.pointToVec2(axis)
    ),

    normalizePointCloud3: (pointCloud) => {
        const normalizedPoints = pointCloud.map(point => ({ ...point }))
        const maxAbsValue = normalizedPoints.reduce((maxValue, point) => {
            return Math.max(maxValue, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z))
        }, 0)

        if (maxAbsValue > tinny) {
            for (const point of normalizedPoints) {
                point.x /= maxAbsValue
                point.y /= maxAbsValue
                point.z /= maxAbsValue
            }
        }

        const center = normalizedPoints.reduce((sum, point) => {
            sum.x += point.x
            sum.y += point.y
            sum.z += point.z
            return sum
        }, { x: 0, y: 0, z: 0 })

        center.x /= normalizedPoints.length
        center.y /= normalizedPoints.length
        center.z /= normalizedPoints.length

        for (const point of normalizedPoints) {
            point.x -= center.x
            point.y -= center.y
            point.z -= center.z
        }

        return normalizedPoints
    },

    midpoint2: (p1, p2) => Geom.vecToPoint2(Vec.scale(Vec.add(Geom.pointToVec2(p1), Geom.pointToVec2(p2)), 0.5)),
    midpoint3: (p1, p2) => Geom.vecToPoint3(Vec.scale(Vec.add(Geom.pointToVec3(p1), Geom.pointToVec3(p2)), 0.5))
}
