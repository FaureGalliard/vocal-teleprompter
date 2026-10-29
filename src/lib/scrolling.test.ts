import { describe, expect, it } from 'vitest'
import { DEFAULT_SCROLLING, scrollTarget } from './scrolling'

const ahead = { ...DEFAULT_SCROLLING, mode: 'ahead' as const, linesBelow: 3 }
const view = { top: 0, height: 400 }
const line = 40

describe('scrollTarget in ahead mode', () => {
    it('holds still while there are enough lines below', () => {
        expect(scrollTarget(ahead, view, { top: 200, height: 30 }, line)).toBeNull()
    })

    it('scrolls just enough to keep the lines below visible', () => {
        // Word ends at 310; three lines below need 430, so move 30 down
        expect(scrollTarget(ahead, view, { top: 280, height: 30 }, line)).toBe(30)
    })

    it('keeps the word in view when the window is too short for the lines below', () => {
        // Three lines below need 150 more, the view is 100 tall: the word
        // goes to the top rather than above it
        const short = { top: 0, height: 100 }
        const word = { top: 200, height: 30 }
        const top = scrollTarget(ahead, short, word, line)
        expect(top).toBe(200)
        // and the next word on that line leaves it there
        expect(scrollTarget(ahead, { top: 200, height: 100 }, word, line)).toBe(200)
    })

    it('shows the next word when it starts further down, as a new paragraph does', () => {
        // Lines below need 430, but the next word only ends at 520
        expect(scrollTarget(ahead, view, { top: 280, height: 30 }, line, { top: 490, height: 30 })).toBe(120)
    })

    it('still keeps the word in view when the next one is too far down', () => {
        expect(scrollTarget(ahead, view, { top: 280, height: 30 }, line, { top: 900, height: 30 })).toBe(280)
    })

    it('brings back a word above the visible part', () => {
        expect(scrollTarget(ahead, { top: 500, height: 400 }, { top: 300, height: 30 }, line)).toBe(260)
    })
})

describe('scrollTarget in fixed mode', () => {
    it('keeps the word at the chosen height', () => {
        const fixed = { ...DEFAULT_SCROLLING, mode: 'fixed' as const, anchor: 0.5 }
        expect(scrollTarget(fixed, view, { top: 1000, height: 30 }, line)).toBe(1000 - 200 + 15)
    })
})
