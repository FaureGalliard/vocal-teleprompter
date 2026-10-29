import { describe, expect, it } from 'vitest'
import { currentCardIndex, splitCards } from './cards'

const SCRIPT = 'Hello world one\n---\nTwo three\n\n----\nfour'

describe('splitCards', () => {
    it('splits on lines holding only dashes', () => {
        const cards = splitCards(SCRIPT, 'en-US')
        expect(cards.map((c) => [c.firstWord, c.wordCount])).toEqual([
            [0, 3],
            [3, 2],
            [5, 1],
        ])
    })

    it('keeps one card when there are no separators', () => {
        expect(splitCards('Just one slide here', 'en-US')).toHaveLength(1)
    })

    it('does not treat dashes inside a line as a separator', () => {
        expect(splitCards('Well --- maybe not', 'en-US')).toHaveLength(1)
    })

    it('gives every segment its exact position in the text', () => {
        for (const card of splitCards(SCRIPT, 'en-US')) {
            for (const segment of card.segments) {
                expect(SCRIPT.slice(segment.offset, segment.offset + segment.text.length)).toBe(
                    segment.text,
                )
            }
        }
    })

    it('handles an empty script', () => {
        expect(splitCards('', 'en-US')).toHaveLength(1)
    })
})

describe('currentCardIndex', () => {
    const cards = splitCards(SCRIPT, 'en-US')

    it('moves to the next card once the last word of a card is spoken', () => {
        expect(currentCardIndex(cards, -1)).toBe(0)
        expect(currentCardIndex(cards, 1)).toBe(0)
        expect(currentCardIndex(cards, 2)).toBe(1)
        expect(currentCardIndex(cards, 4)).toBe(2)
    })

    it('stays on the last card at the end', () => {
        expect(currentCardIndex(cards, 5)).toBe(2)
    })
})
