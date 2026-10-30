import { describe, expect, it } from 'vitest'
import { byRecent, saveScript, scriptTitle } from './library'

describe('scriptTitle', () => {
    it('takes the first line with words in it', () => {
        expect(scriptTitle('\n  \n---\nGood morning, everyone.\nMore')).toBe(
            'Good morning, everyone.',
        )
    })

    it('cuts a long line short', () => {
        const title = scriptTitle('a'.repeat(100))!
        expect(title.length).toBe(48)
        expect(title.endsWith('…')).toBe(true)
    })

    it('has none for an empty script', () => {
        expect(scriptTitle('  \n ')).toBeNull()
    })
})

describe('saveScript', () => {
    it('adds a new script first', () => {
        const list = saveScript([{ id: 'a', text: 'A', updatedAt: 1 }], 'b', 'B', 2)
        expect(list.map((s) => s.id)).toEqual(['b', 'a'])
    })

    it('updates a script in place', () => {
        const list = saveScript([{ id: 'a', text: 'A', updatedAt: 1 }], 'a', 'A2', 5)
        expect(list).toEqual([{ id: 'a', text: 'A2', updatedAt: 5 }])
    })

    it('leaves the list alone when nothing changed', () => {
        const before = [{ id: 'a', text: 'A', updatedAt: 1 }]
        expect(saveScript(before, 'a', 'A', 9)).toBe(before)
    })
})

describe('byRecent', () => {
    it('lists the latest first', () => {
        const list = [
            { id: 'old', text: '', updatedAt: 1 },
            { id: 'new', text: '', updatedAt: 3 },
        ]
        expect(byRecent(list).map((s) => s.id)).toEqual(['new', 'old'])
    })
})
