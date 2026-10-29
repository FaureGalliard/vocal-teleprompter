// Picking each letter's color from what surrounds it on screen

// Relative luminance (WCAG) of an sRGB color given as 0-255 channels
export function luminance(r: number, g: number, b: number) {
    const lin = (v: number) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

// Luminances tried for a letter, denser toward the dark end, where the eye
// tells more of them apart
const LEVELS = Array.from({ length: 41 }, (_, i) => (i / 40) ** 2.2)
// The share of the letter's surroundings it must stand out from: judging
// on the worst tenth, not the average, keeps it readable over busy spots
const WORST_SHARE = 0.1
// A letter keeps its luminance unless another one stands out this much more
const STICKINESS = 1.15

// How well a letter of luminance `y` stands out from the luminances around
// it: the contrast ratio against the worst tenth of them
export function standOut(y: number, around: number[]) {
    const ratios = around.map((l) => ratio(y, l)).sort((a, b) => a - b)
    return ratios[Math.floor(ratios.length * WORST_SHARE)] ?? 21
}

// The luminance for a letter that stands out most from what surrounds it.
// It sticks to `previous` unless something clearly better turns up, so the
// letters don't flicker while the backdrop stays the same.
export function pickLuminance(around: number[], previous?: number) {
    let best = LEVELS[0]
    let bestScore = -1
    for (const y of LEVELS) {
        const score = standOut(y, around)
        if (score > bestScore) [best, bestScore] = [y, score]
    }
    if (previous !== undefined && standOut(previous, around) * STICKINESS >= bestScore)
        return previous
    return best
}

const toHex = (c: number[]) =>
    '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// `base` (#rrggbb) lightened or darkened to luminance `y`, keeping its hue
export function atLuminance(base: string, y: number) {
    const n = parseInt(base.slice(1, 7), 16)
    const from = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    const to = luminance(from[0], from[1], from[2]) > y ? [0, 0, 0] : [255, 255, 255]
    let [lo, hi] = [0, 1]
    for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2
        const c = from.map((v, k) => v + (to[k] - v) * mid)
        const off = luminance(c[0], c[1], c[2]) - y
        if (Math.abs(off) < 0.002) return toHex(c)
        // Still on the base's side of the target: go further
        if (to[0] === 0 ? off > 0 : off < 0) lo = mid
        else hi = mid
    }
    return toHex(from.map((v, k) => v + (to[k] - v) * hi))
}
