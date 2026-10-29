import { describe, expect, it } from 'vitest'
import { runs, words } from './letterPaint'

const tones = (pattern: string) => [...pattern].map((t, key) => ({ key, light: t === 'L' }))
const lengths = (pattern: string) => runs(tones(pattern)).map((r) => r.length)

describe('words', () => {
    it('splits letters where their offsets skip (a space)', () => {
        const letters = [0, 1, 2, 4, 5].map((key) => ({ key }))
        expect(words(letters).map((w) => w.length)).toEqual([3, 2])
    })
})

describe('runs', () => {
    it('keeps a word that wants one tone whole', () => {
        expect(lengths('LLLLL')).toEqual([5])
    })

    it('never leaves a letter alone in its color', () => {
        expect(lengths('LLDLL')).toEqual([5])
        expect(lengths('DLLLL')).toEqual([5])
    })

    it('splits a word across a light and a dark area in long enough runs', () => {
        expect(lengths('LLLLDDDD')).toEqual([4, 4])
        expect(lengths('LLLDDDDL')).toEqual([3, 5])
    })
})
