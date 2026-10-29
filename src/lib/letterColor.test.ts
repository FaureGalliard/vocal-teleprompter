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
