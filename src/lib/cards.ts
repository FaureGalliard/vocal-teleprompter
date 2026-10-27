import { segmentText, type Segment } from './segment'

export interface Card {
    segments: Segment[]
    // Index of the card's first word in the whole script
    firstWord: number
    wordCount: number
}

// A line holding only three or more dashes starts a new card (one per slide)
const SEPARATOR = /^[ \t]*-{3,}[ \t]*$/m

export function splitCards(text: string, language: string): Card[] {
    const cards: Card[] = []
    let offset = 0
    for (const part of text.split(SEPARATOR)) {
        const body = part.replace(/^\s*\n/, '').replace(/\n\s*$/, '')
        if (!body.trim() && cards.length > 0) continue
        let count = 0
        const segments = segmentText(body, language).map((s) =>
            s.word === -1 ? s : { ...s, word: offset + count++ },
        )
        cards.push({ segments, firstWord: offset, wordCount: count })
        offset += count
    }
    return cards
}

// The card holding the next word to be read, so a card counts as done as soon
// as its last word has been spoken
export function currentCardIndex(cards: Card[], currentWord: number): number {
    const next = currentWord + 1
    let index = 0
    for (let i = 0; i < cards.length; i++) {
        if (cards[i].wordCount > 0 && cards[i].firstWord <= next) index = i
    }
    return index
}
