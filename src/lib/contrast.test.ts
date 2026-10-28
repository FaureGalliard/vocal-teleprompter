import { describe, expect, it } from 'vitest'
import { bestOutline, contrastRatio, ensureContrast, MIN_CONTRAST } from './contrast'

describe('contrastRatio', () => {
    it('matches the WCAG reference values', () => {
        expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
        expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
        expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
    })
})

describe('ensureContrast', () => {
    it('leaves readable colors alone', () => {
        expect(ensureContrast('#7698fe', '#0a0000')).toBe('#7698fe')
    })

    it.each([
        ['#202060', '#0a0000'],
        ['#ffff00', '#ffffff'],
        ['#888888', '#777777'],
        ['#ff0000', '#00ff00'],
    ])('brings %s on %s up to the minimum', (text, background) => {
        expect(contrastRatio(ensureContrast(text, background), background)).toBeGreaterThanOrEqual(MIN_CONTRAST)
    })
})

describe('bestOutline', () => {
    it('picks black on light colors and white on dark ones', () => {
        expect(bestOutline('#ffffff')).toBe('#000000')
        expect(bestOutline('#101010')).toBe('#ffffff')
    })
})
