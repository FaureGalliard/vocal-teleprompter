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

// Letters in the middle of a word whose tone (light or dark) differs from
// both neighbors, which agree with each other: a lone letter like that
// breaks the word apart, so it takes its neighbors' color. The first and
// last letters, and one-letter words, keep their own.
export function isolated<T extends { light: boolean }>(word: T[]) {
    const out: number[] = []
    for (let i = 1; i < word.length - 1; i++) {
        const [before, here, after] = [word[i - 1], word[i], word[i + 1]]
        if (before.light === after.light && here.light !== before.light) out.push(i)
    }
    return out
}

// Paints each letter's box on the color map with its own color: the
// luminance that stands out most from what is in and around the box (judged
// on its worst spots), in the hue opposite to what is there; a lone letter
// in the middle of a word takes its left neighbor's color instead. Records
// each letter's color in `colors` and returns the luminances picked, which
// the next round sticks to unless something clearly better turns up.
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

    const measured: (Measured & { key: number; y: number; color: string })[] = []
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
        const y = pickLuminance(around, previous.get(letter.key))
        const color = atLuminance(complement(...mean) ?? textColor, y)
        measured.push({ letter, around, mean, light: y > LIGHT_FROM, key: letter.key, y, color })
    }

    for (const word of words(measured))
        for (const i of isolated(word)) {
            word[i].y = word[i - 1].y
            word[i].color = word[i - 1].color
        }

    const picked = new Map<number, number>()
    for (const m of measured) {
        picked.set(m.key, m.y)
        colors.set(m.key, m.color)
        const n = parseInt(m.color.slice(1), 16)
        const pixel = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
        const { c0, c1, r0, r1 } = box(m.letter)
        for (let r = Math.max(0, r0); r < Math.min(rows, r1); r++)
            for (let c = Math.max(0, c0); c < Math.min(cols, c1); c++)
                image.set(pixel, (r * cols + c) * 4)
    }
    return picked
}
