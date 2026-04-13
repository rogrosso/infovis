// MWC (Multiply-With-Carry) RNG
// Implementation adapted from George Marsaglia's 1999 paper:
// "Multiply-with-carry random number generators"
// Original algorithm: https://www.cs.wm.edu/~bennett/cs301/spr17/mwc.pdf
export function random_seed(s) {
    /**
     * splitmix32 PRNG (seed mixer)
     *
     * Implementation inspired by Sebastiano Vigna's SplitMix algorithm:
     *   Vigna, S. (2014). An experimental exploration of Marsaglia's xorshift
     *   generators, scrambled. arXiv:1402.6246 [cs.DS]
     *
     * This is an independent JavaScript implementation, not copied verbatim.
     */
    function splitmix32(seed) {
        let x = seed | 0;
        return function() {
            x = (x + 0x9e3779b9) | 0;         // golden ratio increment
            let z = x;
            z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
            z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
            return (z ^ (z >>> 16)) >>> 0;      // 32-bit unsigned output
        }
    }
    const s = splitmix32(s)
    const m_w = s()
    const m_z = s()

    return function () {
        m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask
        m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask

        let result = ((m_z << 16) + (m_w & 65535)) >>> 0
        result /= 4294967296
        return result
    }
}

/**
 * easyRandom() - simple seedable random number generator
 *
 * Implementation inspired by classical Linear Congruential Generator (LCG)
 * using 31-bit modulus (2^31 - 1) and normalized to [0,1).
 * 
 * Reference:
 *  - L’Ecuyer, P. (1990). Random number generation. In Handbook of Simulation
 *  - https://en.wikipedia.org/wiki/Linear_congruential_generator
 *
 * Note:
 *  This implementation is for educational purposes. For serious simulations
 *  or reproducible research, consider using a well-tested library like seedrandom.
 */
export function easyRandom(s) {
    let seed = s 
    return function() {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483647
    }
}

export function normalRandomFactory(seed, m_, s_) {
    const mu = m_
    const sigma = s_
    const pi2 = 2 * Math.PI
    const random = random_seed(seed)
    return function( ) {
        let u1 = 1 - random()
        let u2 = random()
        const mag = sigma * Math.sqrt(-2 * Math.log(u1))
        const z0 = mag * Math.cos(pi2 * u2) + mu
        const z1 = mag * Math.sin(pi2 * u2) + mu
        return z0
    }
}