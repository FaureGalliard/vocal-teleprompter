import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { adaptiveBlur, veil } from './glass'

const cols = 20
const rows = 10
const grid = (paint: (c: number, r: number) => number) => {
    const out = new Float32Array(cols * rows * 3)
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            out.fill(paint(c, r), (r * cols + c) * 3, (r * cols + c) * 3 + 3)
    return out
}
const hexAt = (g: Float32Array, i: number) =>
    '#' +
    [0, 1, 2]
        .map((k) =>
            Math.round(g[i * 3 + k])
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')

describe('adaptiveBlur', () => {
    it('leaves a plain area as it is', () => {
        const plain = grid(() => 200)
        expect(adaptiveBlur(plain, cols, rows, 1)[50 * 3]).toBeCloseTo(200)
    })

    it('blurs a busy area more than the radius asked for', () => {
        // Stripes one sample wide: as busy as it gets
        const stripes = grid((c) => (c % 2 ? 255 : 0))
        const plainBlur = adaptiveBlur(
            grid(() => 0),
            cols,
            rows,
            1,
        )
        const out = adaptiveBlur(stripes, cols, rows, 1)
        const i = 5 * cols + 10
        expect(Math.abs(out[i * 3] - 127.5)).toBeLessThan(Math.abs(stripes[i * 3] - 127.5) / 4)
        expect(plainBlur[i * 3]).toBe(0)
    })
})

describe('veil', () => {
    const white = new Uint8ClampedArray(cols * rows * 4).fill(255)

    it('darkens a mid gray behind white text until it reads well', () => {
        const gray = grid(() => 128)
        const out = veil(gray, gray, white, cols, rows)
        expect(contrastRatio('#ffffff', hexAt(out, 50))).toBeGreaterThanOrEqual(7)
    })

    it('leaves alone what already reads well', () => {
        const black = grid(() => 0)
        expect(veil(black, black, white, cols, rows)[50 * 3]).toBe(0)
    })
})
