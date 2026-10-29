import { blur, type Background } from './backdrop'
import { contrastRatio } from './contrast'
import { luminance } from './letterColor'

// Extra blur, in samples, where what is behind the window is busiest
const BUSY_BLUR = 6
// Spread of luminance around a sample past which it counts as fully busy
const BUSY_SPREAD = 0.12
// Contrast the veil makes room for between the text and the glass
const VEIL_CONTRAST = 7
// How far the veil spreads, in samples, so it fades in with no edge
const VEIL_SPREAD = 4

// Blurs what is behind the window by `radius`, and more where it is busy
// (photos, text) than where it is plain, so detail that would fight with the
// letters melts away while flat areas keep their look
export function adaptiveBlur(raw: Background, cols: number, rows: number, radius: number) {
    const light = radius ? blur(raw, cols, rows, radius) : raw
    const heavy = blur(raw, cols, rows, radius + BUSY_BLUR)
    // How busy each spot is: the spread of luminance around it
    const lum = new Float32Array(cols * rows * 3)
    for (let i = 0; i < cols * rows; i++) {
        const l = luminance(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2])
        lum[i * 3] = l
        lum[i * 3 + 1] = l * l
    }
    const local = blur(lum, cols, rows, 3)
    const out = new Float32Array(raw.length)
    for (let i = 0; i < cols * rows; i++) {
        const spread = Math.sqrt(Math.max(0, local[i * 3 + 1] - local[i * 3] ** 2))
        const busy = Math.min(1, spread / BUSY_SPREAD)
        for (let k = 0; k < 3; k++)
            out[i * 3 + k] = light[i * 3 + k] + (heavy[i * 3 + k] - light[i * 3 + k]) * busy
    }
    return out
}

const hex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// How far `behind` must move toward black (negative) or white (positive),
// 0-1, for `text` to reach the veil's contrast over it
function veilAmount(behind: [number, number, number], text: [number, number, number]) {
    const t = hex(...text)
    if (contrastRatio(t, hex(...behind)) >= VEIL_CONTRAST) return 0
    // Away from the text: darker behind light text, lighter behind dark text
    const toward = luminance(...text) > luminance(...behind) ? 0 : 255
    let [lo, hi] = [0, 1]
    for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2
        const moved = behind.map((v) => v + (toward - v) * mid) as [number, number, number]
        if (contrastRatio(t, hex(...moved)) >= VEIL_CONTRAST) hi = mid
        else lo = mid
    }
    return toward ? hi : -hi
}

// A veil in the glass: where the text (`textMap`, RGBA per sample) can't
// stand out enough over what is behind it (`seen`), the glass is darkened or
// lightened just enough, spread softly so it shows as no edge, only as the
// picture dimming a little behind the hard letters. `glass` is what the
// window draws, and `seen` that glass as it shows through the window's own
// background. Returns the veiled glass.
export function veil(
    glass: Background,
    seen: Background,
    textMap: Uint8ClampedArray,
    cols: number,
    rows: number,
) {
    // Signed amounts, spread as a three-channel picture so `blur` can do it
    const amounts = new Float32Array(cols * rows * 3)
    const known = new Map<string, number>()
    for (let i = 0; i < cols * rows; i++) {
        const behind: [number, number, number] = [seen[i * 3], seen[i * 3 + 1], seen[i * 3 + 2]]
        const text: [number, number, number] = [
            textMap[i * 4],
            textMap[i * 4 + 1],
            textMap[i * 4 + 2],
        ]
        const key = `${behind.map((v) => v >> 3)}:${text}`
        let amount = known.get(key)
        if (amount === undefined) {
            amount = veilAmount(behind, text)
            known.set(key, amount)
        }
        amounts[i * 3] = amount
    }
    const soft = blur(amounts, cols, rows, VEIL_SPREAD)
    // Spreading also thins it out: take the stronger of the two at each spot
    const out = new Float32Array(glass.length)
    for (let i = 0; i < cols * rows; i++) {
        const a = Math.abs(amounts[i * 3]) > Math.abs(soft[i * 3]) ? amounts[i * 3] : soft[i * 3]
        const toward = a < 0 ? 0 : 255
        for (let k = 0; k < 3; k++)
            out[i * 3 + k] = glass[i * 3 + k] + (toward - glass[i * 3 + k]) * Math.abs(a)
    }
    return out
}
