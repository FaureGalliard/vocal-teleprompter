import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { colorMap, estimateBackground, settle, type Backdrop, type Surface } from './backdrop'

// A backdrop of 4x6 samples, painted with `paint(col, row)`
function backdrop(paint: (c: number, r: number) => [number, number, number]): Backdrop {
    const cols = 4
    const rows = 6
    const pixels = new Uint8Array(cols * rows * 3)
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) pixels.set(paint(c, r), (r * cols + c) * 3)
    return { cols, rows, step: 1, pixels }
}

const blue = '#7698fe'
const hidden: Surface = { background: '#000000', opacity: 0 }
const hexAt = (image: Uint8ClampedArray, i: number) =>
    '#' + [0, 1, 2].map((k) => image[i * 4 + k].toString(16).padStart(2, '0')).join('')

describe('estimateBackground', () => {
    it('blends the window background over the backdrop', () => {
        const white = backdrop(() => [255, 255, 255])
        const bg = estimateBackground(white, { ...hidden, opacity: 0.5 })
        expect(Math.round(bg[0])).toBe(128)
    })
})

describe('colorMap', () => {
    it('reads well over every gray, in the chosen color', () => {
        for (let v = 0; v <= 255; v += 15) {
            const gray = backdrop(() => [v, v, v])
            const image = colorMap(estimateBackground(gray, hidden), 4, 6, blue)
            const behind = '#' + v.toString(16).padStart(2, '0').repeat(3)
            // Mid grays can't reach 7:1 with any color; the most there is is about 4.6
            expect(contrastRatio(hexAt(image, 0), behind)).toBeGreaterThanOrEqual(4.5)
        }
    })

    it('takes the opposite hue over colors, at a high contrast', () => {
        const colors: [number, number, number][] = [
            [240, 200, 30],
            [200, 30, 40],
            [20, 60, 200],
            [30, 160, 60],
        ]
        for (const color of colors) {
            const image = colorMap(
                estimateBackground(
                    backdrop(() => color),
                    hidden,
                ),
                4,
                6,
                blue,
            )
            const behind = '#' + color.map((v) => v.toString(16).padStart(2, '0')).join('')
            expect(contrastRatio(hexAt(image, 0), behind)).toBeGreaterThanOrEqual(4.5)
        }
        // Dark blue text over yellow, not black
        const yellow = colorMap(
            estimateBackground(
                backdrop(() => colors[0]),
                hidden,
            ),
            4,
            6,
            blue,
        )
        expect(yellow[2]).toBeGreaterThan(yellow[0])
    })
})

describe('settle', () => {
    it('moves halfway toward a new look', () => {
        expect([...settle(new Float32Array([0, 100]), new Float32Array([100, 100]))]).toEqual([
            50, 100,
        ])
    })
})
