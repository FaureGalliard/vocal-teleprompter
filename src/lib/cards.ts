import { segmentText, type Segment } from './segment'

export interface CardSegment extends Segment {
    // Where the segment starts in the full script text, to place the caret there
    offset: number
}

export interface Card {
    segments: CardSegment[]
    // Index of the card's first word in the whole script
    firstWord: number
    wordCount: number
}

// A line holding only three or more dashes starts a new card (one per slide)
const SEPARATOR = /^[ \t]*-{3,}[ \t]*$/gm

export function splitCards(text: string, language: string): Card[] {
    // Slice the text into parts around the separator lines, keeping positions
    const parts: { start: number; text: string }[] = []
    let last = 0
    for (const match of text.matchAll(SEPARATOR)) {
        parts.push({ start: last, text: text.slice(last, match.index) })
        last = match.index + match[0].length
    }
    parts.push({ start: last, text: text.slice(last) })

    const cards: Card[] = []
    let firstWord = 0
    for (const part of parts) {
        const leading = part.text.match(/^\s*\n/)?.[0].length ?? 0
        const body = part.text.slice(leading).replace(/\n\s*$/, '')
        if (!body.trim() && cards.length > 0) continue
        let count = 0
        let offset = part.start + leading
        const segments = segmentText(body, language).map((s) => {
            const segment = {
                ...s,
                word: s.word === -1 ? -1 : firstWord + count++,
                offset,
            }
            offset += s.text.length
            return segment
        })
        cards.push({ segments, firstWord, wordCount: count })
        firstWord += count
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
