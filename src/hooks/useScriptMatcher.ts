import { useState, useCallback, useRef, useMemo } from 'react'
import { splitWords } from '../lib/segment'

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
// How far ahead of the current word a match is looked for
const LOOKAHEAD = 25
// How many trailing spoken words are compared against the script
const CONTEXT = 3

function normalize(word: string): string {
    return word
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^\p{L}\p{N}]/gu, '')
}

// How distinctive a word is: an ideograph or syllable block carries about as
// much as three Latin letters, so short CJK words are not discarded as noise
function weight(normalized: string): number {
    let w = 0
    for (const ch of normalized) w += CJK.test(ch) ? 3 : 1
    return w
}

function maxEdits(length: number): number {
    if (length <= 3) return 0
    if (length <= 6) return 1
    return 2
}

// Levenshtein distance, giving up as soon as it exceeds limit
function editDistance(a: string, b: string, limit: number): number {
    if (Math.abs(a.length - b.length) > limit) return limit + 1
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
    for (let i = 1; i <= a.length; i++) {
        const row = [i]
        let rowMin = i
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
            rowMin = Math.min(rowMin, row[j])
        }
        if (rowMin > limit) return limit + 1
        prev = row
    }
    return prev[b.length]
}

function similar(a: string, b: string): boolean {
    if (!a || !b) return false
    if (a === b) return true
    const shorter = Math.min(a.length, b.length)
    // Interim results often end in a word that is still being spoken
    if (shorter >= 4 && (a.startsWith(b) || b.startsWith(a))) return true
    const limit = maxEdits(shorter)
    return limit > 0 && editDistance(a, b, limit) <= limit
}

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
            if (!spoken.length) return

            const last = spoken[spoken.length - 1]
            const current = currentRef.current
            const from = Math.max(0, current)
            const to = Math.min(from + LOOKAHEAD, normalizedScript.length)

            let best = -1
            let bestContext = 0

            for (let i = from; i < to; i++) {
                if (!similar(normalizedScript[i], last)) continue

                // Count how many of the words said just before line up too
                let context = 1
                for (let j = 1; j < CONTEXT && j < spoken.length && i - j >= 0; j++) {
                    if (similar(normalizedScript[i - j], spoken[spoken.length - 1 - j]))
                        context++
                }

                // A lone short word ("the", "は") is too common to jump on,
                // unless it is right after where we already are
                const reliable = context >= 2 || weight(last) >= 4 || i - current <= 2
                if (!reliable) continue

                // Strictly greater keeps the nearest candidate on ties
                if (context > bestContext) {
                    best = i
                    bestContext = context
                }
            }

            if (best !== -1 && best !== current) moveTo(best, true)
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
