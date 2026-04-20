import { mwcRandomFactory } from 'random'

// Data set Swiss Roll
export function generateSwissRoll(nPoints = 500, noise = 0.05) {
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