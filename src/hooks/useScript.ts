import { useMemo } from 'react'
import { currentCardIndex, splitCards } from '../lib/cards'
import { usePersistentState } from './usePersistentState'
import { useScriptMatcher } from './useScriptMatcher'

// The script, its slide cards and words, and where the speaker is in it
export function useScript(language: string, sampleScript: string) {
    const [content, setContent] = usePersistentState('content', sampleScript)
    const cards = useMemo(() => splitCards(content, language), [content, language])
    const words = useMemo(
        () => cards.flatMap((c) => c.segments.filter((s) => s.word !== -1).map((s) => s.text)),
        [cards],
    )
    const matcher = useScriptMatcher(words, language)
    const { currentWordIndex, jumpTo, reset } = matcher
    const currentCard = currentCardIndex(cards, currentWordIndex)

    // Land just before the card's first word so that word is the next one to read
    const goToCard = (index: number) => {
        const card = cards[Math.max(0, Math.min(index, cards.length - 1))]
        if (card) jumpTo(card.firstWord - 1)
    }
    // With slide cards, paging moves between cards; without, by ten words
    const page = (direction: 1 | -1) =>
        cards.length > 1
            ? goToCard(currentCard + direction)
            : jumpTo(currentWordIndex + direction * 10)

    // Replaces the script and starts it from the top
    const load = (text: string) => {
        setContent(text)
        reset()
    }

    return { content, setContent, cards, words, ...matcher, currentCard, goToCard, page, load }
}
