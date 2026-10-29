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
    // The window is left out of screen captures, so the capture is the backdrop
    hiddenFromCapture: boolean
    background: string
    opacity: number
}

// A word's box, in CSS pixels from the window's top left corner
export interface Box {
    left: number
    top: number
    width: number
    height: number
}

type RGB = [number, number, number]

// Colors this close to the word's own color are its letters, not what is behind
const LETTER_DISTANCE = 60

export function parseBackdrop(buffer: ArrayBuffer, step: number): Backdrop {
    const view = new DataView(buffer)
    return {
        cols: view.getUint32(0, true),
        rows: view.getUint32(4, true),
        step,
        pixels: new Uint8Array(buffer, 8),
    }
}

const rgb = (hex: string): RGB => {
    const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const hex = ([r, g, b]: RGB) =>
    '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

const distance = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
}

// What the eye sees behind the letters in a box: the window's background
// blended over the backdrop. Null when nothing but letters was found.
export function behind(
    backdrop: Backdrop,
    surface: Surface,
    box: Box,
    scale: number,
    letterColor: string,
): string | null {
    const { cols, rows, step, pixels } = backdrop
    const from = (v: number, max: number) =>
        Math.max(0, Math.min(max, Math.floor((v * scale) / step)))
    const [c0, c1] = [from(box.left, cols), from(box.left + box.width, cols)]
    const [r0, r1] = [from(box.top, rows), from(box.top + box.height, rows)]
    const fill = rgb(surface.background)
    const letters = rgb(letterColor)
    const channels: [number[], number[], number[]] = [[], [], []]
    for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
            const i = (r * cols + c) * 3
            let p: RGB = [pixels[i], pixels[i + 1], pixels[i + 2]]
            if (surface.hiddenFromCapture) {
                const a = surface.opacity
                p = [0, 1, 2].map((k) => a * fill[k] + (1 - a) * p[k]) as RGB
            } else if (distance(p, letters) < LETTER_DISTANCE) continue
            p.forEach((v, k) => channels[k].push(v))
        }
    }
    if (!channels[0].length) return null
    return hex(channels.map(median) as RGB)
}

// The word's color for each half of its box: the chosen color, nudged just
// enough to read well (WCAG) on what is behind that half. Both halves match
// unless the word straddles a light and a dark area.
export function wordColors(
    backdrop: Backdrop,
    surface: Surface,
    box: Box,
    scale: number,
    textColor: string,
    shown: string,
): [string, string] | null {
    const half = { ...box, width: box.width / 2 }
    const left = behind(backdrop, surface, half, scale, shown)
    const right = behind(backdrop, surface, { ...half, left: box.left + half.width }, scale, shown)
    if (!left && !right) return null
    const l = ensureContrast(textColor, left ?? right!)
    const r = ensureContrast(textColor, right ?? left!)
    // Close enough to read as one color
    return distance(rgb(l), rgb(r)) < 40 ? [l, l] : [l, r]
}
