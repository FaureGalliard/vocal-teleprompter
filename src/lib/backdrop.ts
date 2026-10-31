import { ensureContrastRgb } from './contrast'

// Every `step`-th physical pixel of the monitor the window is on, which sits
// at `x`, `y` on the desktop (physical pixels)
export interface Backdrop {
    cols: number
    rows: number
    step: number
    x: number
    y: number
    pixels: Uint8Array
}

// Where the window's inside is on the desktop, in physical pixels
export interface Place {
    x: number
    y: number
    width: number
    height: number
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
        x: view.getInt32(8, true),
        y: view.getInt32(12, true),
        step,
        pixels: new Uint8Array(buffer, 16),
    }
}

// The part of a monitor's capture behind the window at `place`, sample by
// sample; anything off the monitor reads as black. Null when the window has
// left that monitor.
export function cropBackdrop(backdrop: Backdrop, place: Place) {
    const { cols, rows, step, pixels } = backdrop
    const left = Math.floor((place.x - backdrop.x) / step)
    const top = Math.floor((place.y - backdrop.y) / step)
    if (left >= cols || top >= rows || left + place.width / step <= 0) return null
    if (top + place.height / step <= 0) return null
    const w = Math.ceil(place.width / step)
    const h = Math.ceil(place.height / step)
    const out = new Uint8Array(w * h * 3)
    // The columns of each row that are on the monitor, copied in one go
    const [c0, c1] = [Math.max(0, -left), Math.min(w, cols - left)]
    for (let r = 0; r < h; r++) {
        const sr = top + r
        if (sr < 0 || sr >= rows || c0 >= c1) continue
        const from = (sr * cols + left + c0) * 3
        out.set(pixels.subarray(from, from + (c1 - c0) * 3), (r * w + c0) * 3)
    }
    return { cols: w, rows: h, pixels: out }
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
export function estimateBackground(
    backdrop: { cols: number; rows: number; pixels: Uint8Array },
    surface: Surface,
): Background {
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
    // Backdrops repeat a lot of nearly equal colors: work each out once,
    // kept as 0xRRGGBB
    const known = new Map<number, number>()
    for (let i = 0; i < cols * rows; i++) {
        const r = background[i * 3]
        const g = background[i * 3 + 1]
        const b = background[i * 3 + 2]
        const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2)
        let color = known.get(key)
        if (color === undefined) {
            const base = complement(r, g, b) ?? textColor
            const [cr, cg, cb] = ensureContrastRgb(base, [r, g, b], TARGET_CONTRAST)
            color = (cr << 16) | (cg << 8) | cb
            known.set(key, color)
        }
        image[i * 4] = color >> 16
        image[i * 4 + 1] = (color >> 8) & 255
        image[i * 4 + 2] = color & 255
        image[i * 4 + 3] = 255
    }
    return image
}

// Averages every sample with its neighbors `radius` samples around, so the
// text color shifts gradually instead of jumping from letter to letter over
// a busy picture
export function blur(background: Background, cols: number, rows: number, radius = 2) {
    // Plain numbers and loops only: an array made per sample is what made
    // this slow in WebKit, whose engine keeps every one of them
    const pass = (from: Float32Array, dc: number, dr: number) => {
        const to = new Float32Array(from.length)
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
                let n = 0
                let sr = 0
                let sg = 0
                let sb = 0
                for (let d = -radius; d <= radius; d++) {
                    const cc = c + d * dc
                    const rr = r + d * dr
                    if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue
                    const i = (rr * cols + cc) * 3
                    sr += from[i]
                    sg += from[i + 1]
                    sb += from[i + 2]
                    n++
                }
                const o = (r * cols + c) * 3
                to[o] = sr / n
                to[o + 1] = sg / n
                to[o + 2] = sb / n
            }
        return to
    }
    return pass(pass(background, 1, 0), 0, 1)
}

// Average change per channel past which a new look is taken at once
const BIG_CHANGE = 20

// Eases from the previous estimate toward the new one, so noise and small
// changes don't make the text flicker; a big change (the window moved, the
// slide changed) is taken at once, so the text catches up right away
export function settle(previous: Background | null, next: Background, keep = 0.5): Background {
    if (!previous || previous.length !== next.length) return next
    let change = 0
    for (let i = 0; i < next.length; i++) change += Math.abs(next[i] - previous[i])
    if (change / next.length > BIG_CHANGE) return next
    const out = new Float32Array(next.length)
    for (let i = 0; i < next.length; i++) out[i] = keep * previous[i] + (1 - keep) * next[i]
    return out
}
