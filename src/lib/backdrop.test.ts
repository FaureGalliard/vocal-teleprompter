import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { behind, wordColors, type Backdrop, type Surface } from './backdrop'

// A backdrop of 20x10 sampled pixels, painted with `paint(col, row)`
function backdrop(paint: (c: number, r: number) => [number, number, number]): Backdrop {
    const cols = 20
    const rows = 10
    const pixels = new Uint8Array(cols * rows * 3)
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) pixels.set(paint(c, r), (r * cols + c) * 3)
    return { cols, rows, step: 1, pixels }
}

const hidden: Surface = { hiddenFromCapture: true, background: '#000000', opacity: 0 }
const box = { left: 0, top: 0, width: 20, height: 10 }
const blue = '#7698fe'

describe('behind', () => {
    it('blends the window background over the backdrop', () => {
        const white = backdrop(() => [255, 255, 255])
        const half = { ...hidden, opacity: 0.5 }
        expect(behind(white, half, box, 1, blue)).toBe('#808080')
    })

    it('leaves out the letters when the window is in the capture', () => {
        // White page with a few blue letter pixels on it
        const page = backdrop((c) => (c % 5 === 0 ? [118, 152, 254] : [255, 255, 255]))
        const shown = { ...hidden, hiddenFromCapture: false }
        expect(behind(page, shown, box, 1, blue)).toBe('#ffffff')
    })
})

describe('wordColors', () => {
    it('darkens the text over a light backdrop until it reads well', () => {
        const white = backdrop(() => [255, 255, 255])
        const [left, right] = wordColors(white, hidden, box, 1, blue, blue)!
        expect(left).toBe(right)
        expect(contrastRatio(left, '#ffffff')).toBeGreaterThanOrEqual(4.5)
    })

    it('keeps the chosen color over a dark backdrop', () => {
        const black = backdrop(() => [0, 0, 0])
        expect(wordColors(black, hidden, box, 1, blue, blue)).toEqual([blue, blue])
    })

    it('splits a word that straddles a light and a dark area', () => {
        const split = backdrop((c) => (c < 10 ? [0, 0, 0] : [255, 255, 255]))
        const [left, right] = wordColors(split, hidden, box, 1, blue, blue)!
        expect(left).toBe(blue)
        expect(contrastRatio(right, '#ffffff')).toBeGreaterThanOrEqual(4.5)
    })
})
