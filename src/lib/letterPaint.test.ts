import { describe, expect, it } from 'vitest'
import { isolated, words } from './letterPaint'

const tones = (pattern: string) => [...pattern].map((t, key) => ({ key, light: t === 'L' }))

describe('words', () => {
    it('splits letters where their offsets skip (a space)', () => {
        const letters = [0, 1, 2, 4, 5].map((key) => ({ key }))
        expect(words(letters).map((w) => w.length)).toEqual([3, 2])
    })
})

describe('isolated', () => {
    const lone = (pattern: string) => isolated(tones(pattern))

    it('finds a lone letter of another tone in the middle of a word', () => {
        expect(lone('DDLDD')).toEqual([2])
    })

    it('keeps the first and last letters, and one-letter words', () => {
        expect(lone('LDDD')).toEqual([])
        expect(lone('DDDL')).toEqual([])
        expect(lone('L')).toEqual([])
    })

    it('keeps two letters together in another tone', () => {
        expect(lone('DDLLDD')).toEqual([])
    })
})
