import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { atLuminance, luminance, pickLuminance, standOut } from './letterColor'

const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return luminance((n >> 16) & 255, (n >> 8) & 255, n & 255)
}

describe('pickLuminance', () => {
    it('goes dark over light and light over dark', () => {
        expect(pickLuminance(Array(50).fill(lum('#f5f5f5')))).toBeLessThan(0.02)
        expect(pickLuminance(Array(50).fill(lum('#101010')))).toBeGreaterThan(0.9)
    })

    it('stands out from a busy mix better than either extreme alone', () => {
        // Mostly light with a dark tenth: dark text would vanish on that tenth
        const around = [...Array(80).fill(lum('#e0e0e0')), ...Array(20).fill(lum('#202020'))]
        const y = pickLuminance(around)
        expect(standOut(y, around)).toBeGreaterThan(standOut(0, around))
        expect(standOut(y, around)).toBeGreaterThan(standOut(1, around))
    })

    it('keeps its previous pick while the surroundings stay the same', () => {
        const around = Array(50).fill(lum('#f0f0f0'))
        const first = pickLuminance(around)
        expect(pickLuminance(around, first)).toBe(first)
    })
})

describe('atLuminance', () => {
    it('reaches the luminance asked for, keeping the hue', () => {
        const dark = atLuminance('#3060ff', 0.02)
        expect(lum(dark)).toBeCloseTo(0.02, 2)
        const n = parseInt(dark.slice(1), 16)
        expect(n & 255).toBeGreaterThan((n >> 16) & 255)
        expect(contrastRatio(atLuminance('#3060ff', 0.9), '#000000')).toBeGreaterThan(15)
    })
})

// Regression: these ran a whole core in WebKit (1-2 s a look) until they were
// rewritten without an array per sample; the rewrite must pick the same
describe('picking stays the same as the plain way of working it out', () => {
    let seed = 7
    const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
    const plainStandOut = (y: number, around: number[]) => {
        const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
        const ratios = around.map((l) => ratio(y, l)).sort((a, b) => a - b)
        return ratios[Math.floor(ratios.length * 0.05)] ?? 21
    }

    it('judges a letter against its worst surroundings the same', () => {
        for (let n = 0; n < 2000; n++) {
            const around = Array.from(
                { length: 1 + Math.floor(random() * 150) },
                () => random() ** 2,
            )
            const y = random()
            expect(standOut(y, around)).toBe(plainStandOut(y, around))
        }
        expect(standOut(0.5, [])).toBe(21)
    })

    it('picks the same luminance, sticking to the previous one alike', () => {
        const levels = Array.from({ length: 41 }, (_, i) => (i / 40) ** 2.2)
        for (let n = 0; n < 300; n++) {
            const around = Array.from(
                { length: 1 + Math.floor(random() * 100) },
                () => random() ** 2,
            )
            let best = levels[0]
            let bestScore = -1
            for (const y of levels) {
                const score = plainStandOut(y, around)
                if (score > bestScore) [best, bestScore] = [y, score]
            }
            const previous = random()
            const sticks = plainStandOut(previous, around) * 1.15 >= bestScore
            expect(pickLuminance(around)).toBe(best)
            expect(pickLuminance(around, previous)).toBe(sticks ? previous : best)
        }
    })
})
