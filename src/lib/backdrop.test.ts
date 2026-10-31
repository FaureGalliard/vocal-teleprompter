import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import {
    blur,
    colorMap,
    cropBackdrop,
    estimateBackground,
    parseBackdrop,
    samePicture,
    settle,
    type Backdrop,
    type Surface,
} from './backdrop'

// A backdrop of 4x6 samples, painted with `paint(col, row)`
function backdrop(paint: (c: number, r: number) => [number, number, number]): Backdrop {
    const cols = 4
    const rows = 6
    const pixels = new Uint8Array(cols * rows * 3)
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) pixels.set(paint(c, r), (r * cols + c) * 3)
    return { cols, rows, step: 1, x: 0, y: 0, pixels }
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
    it('moves halfway toward a small change', () => {
        expect([...settle(new Float32Array([0, 10]), new Float32Array([10, 10]))]).toEqual([5, 10])
    })

    it('takes a big change at once', () => {
        expect([...settle(new Float32Array([0, 0]), new Float32Array([200, 200]))]).toEqual([
            200, 200,
        ])
    })
})

describe('cropBackdrop', () => {
    // Each sample holds its own column and row
    const monitor = { ...backdrop((c, r) => [c, r, 0]), x: 100, y: 50 }

    it('cuts out the samples behind the window', () => {
        const crop = cropBackdrop(monitor, { x: 101, y: 52, width: 2, height: 3 })!
        expect(crop.cols).toBe(2)
        expect(crop.rows).toBe(3)
        expect([...crop.pixels.subarray(0, 3)]).toEqual([1, 2, 0])
    })

    it('reads black where the window hangs off the monitor', () => {
        const crop = cropBackdrop(monitor, { x: 98, y: 50, width: 3, height: 1 })!
        expect([...crop.pixels.subarray(0, 3)]).toEqual([0, 0, 0])
        expect([...crop.pixels.subarray(6, 9)]).toEqual([0, 0, 0])
    })

    it('gives nothing once the window is on another monitor', () => {
        expect(cropBackdrop(monitor, { x: 500, y: 50, width: 2, height: 2 })).toBeNull()
    })
})

// Regression: these made an array for every sample, which kept WebKit's
// worker busy for over a second a look; the rewrite must give the same
describe('the rewritten loops give the same as the plain way', () => {
    let seed = 3
    const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff

    it('blurs the same', () => {
        const [cols, rows] = [37, 23]
        const background = Float32Array.from({ length: cols * rows * 3 }, () => random() * 255)
        const pass = (from: Float32Array, dc: number, dr: number, radius: number) => {
            const to = new Float32Array(from.length)
            for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++) {
                    let n = 0
                    const sum = [0, 0, 0]
                    for (let d = -radius; d <= radius; d++) {
                        const [cc, rr] = [c + d * dc, r + d * dr]
                        if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue
                        for (let k = 0; k < 3; k++) sum[k] += from[(rr * cols + cc) * 3 + k]
                        n++
                    }
                    for (let k = 0; k < 3; k++) to[(r * cols + c) * 3 + k] = sum[k] / n
                }
            return to
        }
        for (const radius of [1, 2, 4])
            expect(blur(background, cols, rows, radius)).toEqual(
                pass(pass(background, 1, 0, radius), 0, 1, radius),
            )
    })

    it('crops the same, also with the window partly off the monitor', () => {
        const backdrop: Backdrop = {
            cols: 50,
            rows: 30,
            step: 2,
            x: 0,
            y: 0,
            pixels: Uint8Array.from({ length: 50 * 30 * 3 }, () => random() * 255),
        }
        const plain = (place: { x: number; y: number; width: number; height: number }) => {
            const { cols, rows, step, pixels } = backdrop
            const left = Math.floor((place.x - backdrop.x) / step)
            const top = Math.floor((place.y - backdrop.y) / step)
            const [w, h] = [Math.ceil(place.width / step), Math.ceil(place.height / step)]
            const out = new Uint8Array(w * h * 3)
            for (let r = 0; r < h; r++)
                for (let c = 0; c < w; c++) {
                    const [sr, sc] = [top + r, left + c]
                    if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) continue
                    for (let k = 0; k < 3; k++)
                        out[(r * w + c) * 3 + k] = pixels[(sr * cols + sc) * 3 + k]
                }
            return { cols: w, rows: h, pixels: out }
        }
        for (const place of [
            { x: 10, y: 10, width: 40, height: 20 },
            { x: -20, y: -6, width: 60, height: 30 },
            { x: 80, y: 40, width: 60, height: 40 },
            { x: -30, y: 0, width: 200, height: 80 },
            { x: 3, y: 1, width: 41, height: 21 },
        ])
            expect(cropBackdrop(backdrop, place)).toEqual(plain(place))
    })
})

describe('parseBackdrop', () => {
    it('reads the header and the pixels after it', () => {
        const buffer = new ArrayBuffer(16 + 3)
        const view = new DataView(buffer)
        view.setUint32(0, 1, true)
        view.setUint32(4, 1, true)
        view.setInt32(8, -1920, true)
        view.setInt32(12, 40, true)
        new Uint8Array(buffer, 16).set([1, 2, 3])
        const look = parseBackdrop(buffer, 2)
        expect(look).toMatchObject({ cols: 1, rows: 1, x: -1920, y: 40, step: 2 })
        expect([...look!.pixels]).toEqual([1, 2, 3])
    })

    it('brings nothing when the streamed monitor did not change', () => {
        expect(parseBackdrop(new ArrayBuffer(0), 2)).toBeNull()
    })
})

describe('samePicture', () => {
    const map = (value: number) => new Uint8ClampedArray(4 * 6).fill(value)

    it('keeps the map showing when the new one looks no different', () => {
        // Swapping in a map that looked the same made the letters and the
        // border blink while the browser took it in
        expect(samePicture(map(120), map(120))).toBe(true)
        expect(samePicture(map(120), map(126))).toBe(true)
    })

    it('swaps it when any point changes enough to see', () => {
        const next = map(120)
        next[13] = 127
        expect(samePicture(map(120), next)).toBe(false)
    })

    it('swaps it when there is none yet or the window changed size', () => {
        expect(samePicture(null, map(120))).toBe(false)
        expect(samePicture(map(120), new Uint8ClampedArray(8).fill(120))).toBe(false)
    })
})
