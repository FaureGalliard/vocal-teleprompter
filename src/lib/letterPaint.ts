import { complement, type Background } from './backdrop'
import { atLuminance, luminance, pickLuminance } from './letterColor'

// What the eye sees behind the text, sample by sample
export interface Seen {
    cols: number
    rows: number
    step: number
    rgb: Background
}

// A visible letter's box in CSS pixels from the window's corner, keyed by its
// offset in the script
export interface Letter {
    key: number
    left: number
    top: number
    right: number
    bottom: number
}

// Samples looked at around each letter's box, besides those inside it
const AROUND = 2

// Paints each letter's box on the color map with its own color: the
// luminance that stands out most from what is in and around the box (judged
// on its worst spots), in the hue opposite to what is there. Records each
// letter's color in `colors` and returns the luminances picked, which the
// next round sticks to unless something clearly better turns up.
export function paintLetters(
    image: Uint8ClampedArray,
    seen: Seen,
    letters: Letter[],
    textColor: string,
    scale: number,
    previous: Map<number, number>,
    colors: Map<number, string>,
) {
    const { cols, rows, step, rgb } = seen
    const cell = (v: number) => (v * scale) / step
    const picked = new Map<number, number>()
    for (const letter of letters) {
        const [c0, c1] = [Math.floor(cell(letter.left)), Math.ceil(cell(letter.right))]
        const [r0, r1] = [Math.floor(cell(letter.top)), Math.ceil(cell(letter.bottom))]
        const around: number[] = []
        const sum = [0, 0, 0]
        for (let r = Math.max(0, r0 - AROUND); r < Math.min(rows, r1 + AROUND); r++)
            for (let c = Math.max(0, c0 - AROUND); c < Math.min(cols, c1 + AROUND); c++) {
                const i = (r * cols + c) * 3
                around.push(luminance(rgb[i], rgb[i + 1], rgb[i + 2]))
                for (let k = 0; k < 3; k++) sum[k] += rgb[i + k]
            }
        if (!around.length) continue
        const y = pickLuminance(around, previous.get(letter.key))
        picked.set(letter.key, y)
        const [r, g, b] = sum.map((v) => v / around.length)
        const color = atLuminance(complement(r, g, b) ?? textColor, y)
        colors.set(letter.key, color)
        const n = parseInt(color.slice(1), 16)
        const pixel = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
        for (let rr = Math.max(0, r0); rr < Math.min(rows, r1); rr++)
            for (let cc = Math.max(0, c0); cc < Math.min(cols, c1); cc++)
                image.set(pixel, (rr * cols + cc) * 4)
    }
    return picked
}
