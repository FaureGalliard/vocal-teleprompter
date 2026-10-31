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
        expect(contrastRatio(ensureContrast(text, background), background)).toBeGreaterThanOrEqual(
            MIN_CONTRAST,
        )
    })
})

describe('bestOutline', () => {
    it('picks black on light colors and white on dark ones', () => {
        expect(bestOutline('#ffffff')).toBe('#000000')
        expect(bestOutline('#101010')).toBe('#ffffff')
    })
})

// Regression: worked out on #rrggbb strings, the text colors over a picture
// took most of a second; the numbers-only path must land on the same colors
describe('ensureContrast stays the same as the plain way of working it out', () => {
    const lum = (rgb: number[]) => {
        const [r, g, b] = rgb.map((v) => {
            const c = v / 255
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const parse = (hex: string) => {
        const n = parseInt(hex.slice(1), 16)
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const toHex = (rgb: number[]) =>
        '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    const ratio = (a: number[], b: number[]) => {
        const [la, lb] = [lum(a), lum(b)]
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
    }
    const plain = (text: string, background: string, min: number) => {
        const bg = parse(background)
        if (ratio(parse(text), bg) >= min) return text
        const to = ratio(bg, [0, 0, 0]) >= ratio(bg, [255, 255, 255]) ? [0, 0, 0] : [255, 255, 255]
        const from = parse(text)
        const mix = (t: number) => parse(toHex(from.map((v, k) => v + (to[k] - v) * t)))
        let [lo, hi] = [0, 1]
        for (let i = 0; i < 12; i++) {
            const mid = (lo + hi) / 2
            if (ratio(mix(mid), bg) >= min) hi = mid
            else lo = mid
        }
        return toHex(mix(hi))
    }

    it('lands on the same color for any text, background and target', () => {
        let seed = 11
        const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
        const color = () =>
            '#' +
            Math.floor(random() * 0xffffff)
                .toString(16)
                .padStart(6, '0')
        for (let n = 0; n < 5000; n++) {
            const [text, background, min] = [color(), color(), 1 + random() * 15]
            expect(ensureContrast(text, background, min)).toBe(plain(text, background, min))
        }
    })
})
