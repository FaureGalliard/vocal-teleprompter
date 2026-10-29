import { ensureContrast } from './contrast'

// Every `step`-th physical pixel of the screen where the window is
export interface Backdrop {
    cols: number
    rows: number
    step: number
    pixels: Uint8Array
}

// How the window is drawn over the backdrop
export interface Surface {
    background: string
    opacity: number
}

// What sits behind the text, as RGB per sample (0-255 floats)
export type Background = Float32Array

export function parseBackdrop(buffer: ArrayBuffer, step: number): Backdrop {
    const view = new DataView(buffer)
    return {
        cols: view.getUint32(0, true),
        rows: view.getUint32(4, true),
        step,
        pixels: new Uint8Array(buffer, 8),
    }
}

export const rgb = (hex: string): [number, number, number] => {
    const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const hex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// What the eye sees behind the text at every sample: the window's
// background blended over the backdrop (the capture never includes the
// window itself)
export function estimateBackground(backdrop: Backdrop, surface: Surface): Background {
    const { cols, rows, pixels } = backdrop
    const out = new Float32Array(cols * rows * 3)
    const fill = rgb(surface.background)
    const a = surface.opacity
    for (let i = 0; i < cols * rows; i++)
        for (let k = 0; k < 3; k++) out[i * 3 + k] = a * fill[k] + (1 - a) * pixels[i * 3 + k]
    return out
}

// Contrast every point of the text aims for with what is behind it, well
// past WCAG AAA (7:1) so thin letters still read; where a backdrop can't give
// that much, the most it can
const TARGET_CONTRAST = 12
// Below this spread between channels a color reads as gray, with no hue
const MIN_SATURATION = 40

// The hue opposite to the color's, vivid, or null for grays
export function complement(r: number, g: number, b: number): string | null {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max - min < MIN_SATURATION) return null
    const d = max - min
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    const hue = ((h * 60 + 180) % 360) / 60
    // Fully saturated color at that hue
    const x = 1 - Math.abs((hue % 2) - 1)
    const sector = Math.floor(hue) % 6
    const [cr, cg, cb] = [
        [1, x, 0],
        [x, 1, 0],
        [0, 1, x],
        [0, x, 1],
        [x, 0, 1],
        [1, 0, x],
    ][sector]
    return hex(cr * 255, cg * 255, cb * 255)
}

// The text color for every sample as an RGBA image. Over a colored area it
// takes the opposite hue, over a gray one the chosen color, either lightened
// or darkened until it reaches the target contrast (WCAG ratio) with what is
// right behind it, so each letter and even part of a letter stands out.
// Scaled up smoothly, it shades across where the backdrop changes.
export function colorMap(background: Background, cols: number, rows: number, textColor: string) {
    const image = new Uint8ClampedArray(cols * rows * 4)
    // Backdrops repeat a lot of nearly equal colors: work each out once
    const known = new Map<number, number[]>()
    for (let i = 0; i < cols * rows; i++) {
        const [r, g, b] = [background[i * 3], background[i * 3 + 1], background[i * 3 + 2]]
        const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2)
        let color = known.get(key)
        if (!color) {
            const base = complement(r, g, b) ?? textColor
            color = [...rgb(ensureContrast(base, hex(r, g, b), TARGET_CONTRAST)), 255]
            known.set(key, color)
        }
        image.set(color, i * 4)
    }
    return image
}

// Averages every sample with its neighbors `radius` samples around, so the
// text color shifts gradually instead of jumping from letter to letter over
// a busy picture
export function blur(background: Background, cols: number, rows: number, radius = 2) {
    const pass = (from: Float32Array, dc: number, dr: number) => {
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
    return pass(pass(background, 1, 0), 0, 1)
}

// Eases from the previous estimate toward the new one, so noise and
// one-off changes don't make the text flicker
export function settle(previous: Background | null, next: Background, keep = 0.5): Background {
    if (!previous || previous.length !== next.length) return next
    const out = new Float32Array(next.length)
    for (let i = 0; i < next.length; i++) out[i] = keep * previous[i] + (1 - keep) * next[i]
    return out
}
