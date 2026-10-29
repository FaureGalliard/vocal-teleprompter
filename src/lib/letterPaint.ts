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
// Luminance past which a letter reads as light text rather than dark
const LIGHT_FROM = 0.18
// Fewest letters a word may be split into when it straddles a light and a
// dark area: a lone letter in another color breaks the word apart
const MIN_RUN = 3

interface Measured {
    letter: Letter
    // Luminances in and around its box, and their average color
    around: number[]
    mean: [number, number, number]
    light: boolean
}

// Groups letters into words: offsets that follow one another with no gap
export function words<T extends { key: number }>(letters: T[]) {
    const sorted = [...letters].sort((a, b) => a.key - b.key)
    const out: T[][] = []
    for (const letter of sorted) {
        const word = out[out.length - 1]
        if (word && word[word.length - 1].key === letter.key - 1) word.push(letter)
        else out.push([letter])
    }
    return out
}

// Splits a word into runs of letters that want the same tone (light or
// dark), folding any run shorter than MIN_RUN into the one before it (or
// after it, at the start), so no letter ends up alone in its color
export function runs<T extends { light: boolean }>(word: T[]) {
    const out: T[][] = []
    for (const item of word) {
        const run = out[out.length - 1]
        if (run && run[0].light === item.light) run.push(item)
        else out.push([item])
    }
    for (let i = 0; i < out.length; i++) {
        if (out.length === 1 || out[i].length >= MIN_RUN) continue
        const into = i > 0 ? i - 1 : i + 1
        out[into] = i > 0 ? [...out[into], ...out[i]] : [...out[i], ...out[into]]
        out.splice(i, 1)
        i = -1
    }
    return out
}

// Paints each letter's box on the color map. The color is decided per run
// of letters (a whole word, or a part of one of at least MIN_RUN letters
// when it straddles a light and a dark area): the luminance that stands out
// most from what is in and around those letters (judged on its worst spots),
// in the hue opposite to what is there. Records each letter's color in
// `colors` and returns the luminances picked, which the next round sticks to
// unless something clearly better turns up.
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
    const box = (l: Letter) => ({
        c0: Math.floor(cell(l.left)),
        c1: Math.ceil(cell(l.right)),
        r0: Math.floor(cell(l.top)),
        r1: Math.ceil(cell(l.bottom)),
    })

    const measured: Measured[] = []
    for (const letter of letters) {
        const { c0, c1, r0, r1 } = box(letter)
        const around: number[] = []
        const sum = [0, 0, 0]
        for (let r = Math.max(0, r0 - AROUND); r < Math.min(rows, r1 + AROUND); r++)
            for (let c = Math.max(0, c0 - AROUND); c < Math.min(cols, c1 + AROUND); c++) {
                const i = (r * cols + c) * 3
                around.push(luminance(rgb[i], rgb[i + 1], rgb[i + 2]))
                for (let k = 0; k < 3; k++) sum[k] += rgb[i + k]
            }
        if (!around.length) continue
        const mean = sum.map((v) => v / around.length) as [number, number, number]
        const light = pickLuminance(around) > LIGHT_FROM
        measured.push({ letter, around, mean, light })
    }

    const picked = new Map<number, number>()
    for (const word of words(measured.map((m) => ({ ...m, key: m.letter.key })))) {
        for (const run of runs(word)) {
            const around = run.flatMap((m) => m.around)
            const y = pickLuminance(around, previous.get(run[0].key))
            const mean = [0, 1, 2].map(
                (k) => run.reduce((s, m) => s + m.mean[k], 0) / run.length,
            ) as [number, number, number]
            const color = atLuminance(complement(...mean) ?? textColor, y)
            const n = parseInt(color.slice(1), 16)
            const pixel = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
            for (const m of run) {
                picked.set(m.key, y)
                colors.set(m.key, color)
                const { c0, c1, r0, r1 } = box(m.letter)
                for (let r = Math.max(0, r0); r < Math.min(rows, r1); r++)
                    for (let c = Math.max(0, c0); c < Math.min(cols, c1); c++)
                        image.set(pixel, (r * cols + c) * 4)
            }
        }
    }
    return picked
}
