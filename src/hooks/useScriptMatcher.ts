import { useState, useCallback, useRef, useMemo } from 'react'
import { splitWords } from '../lib/segment'
import { nextPosition, normalize } from '../lib/matcher'

export function useScriptMatcher(scriptWords: string[], language: string) {
    const [currentWordIndex, setCurrentWordIndex] = useState(-1)
    // Whether the current word was reached by voice, or placed by hand
    // (click, arrows, slide buttons) as the spot to continue from
    const [heard, setHeard] = useState(false)
    const currentRef = useRef(-1)
    const normalizedScript = useMemo(() => scriptWords.map(normalize), [scriptWords])

    const moveTo = useCallback((index: number, byVoice: boolean) => {
        currentRef.current = index
        setCurrentWordIndex(index)
        setHeard(byVoice)
    }, [])

    const processTranscript = useCallback(
        (transcript: string) => {
            const spoken = splitWords(transcript, language).map(normalize).filter(Boolean)
            const current = currentRef.current
            const next = nextPosition(normalizedScript, spoken, current)
            if (next !== current) moveTo(next, true)
        },
        [normalizedScript, language, moveTo],
    )

    const reset = useCallback(() => moveTo(-1, false), [moveTo])

    // Manual repositioning; matching resumes from the chosen word
    const jumpTo = useCallback(
        (index: number) =>
            moveTo(Math.max(-1, Math.min(index, scriptWords.length - 1)), false),
        [moveTo, scriptWords.length],
    )

    return { currentWordIndex, heard, processTranscript, reset, jumpTo }
}
