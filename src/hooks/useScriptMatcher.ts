import { useState, useCallback, useRef } from 'react'
import { splitWords } from '../lib/segment'

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

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

function fuzzyMatch(a: string, b: string): boolean {
    const na = normalize(a)
    const nb = normalize(b)
    if (!na || !nb) return false
    if (na === nb) return true
    if (na.length < 4 || nb.length < 4) return na === nb
    if (Math.abs(na.length - nb.length) > 2) return false
    if (na.includes(nb) || nb.includes(na)) return true
    let mismatches = 0
    const len = Math.min(na.length, nb.length)
    for (let i = 0; i < len; i++) {
        if (na[i] !== nb[i]) mismatches++
        if (mismatches > 1) return false
    }
    return Math.abs(na.length - nb.length) <= 1
}

export function useScriptMatcher(scriptWords: string[], language: string) {
    const [currentWordIndex, setCurrentWordIndex] = useState(-1)
    const searchStartRef = useRef(0)

    const processTranscript = useCallback(
        (transcript: string) => {
            const spokenWords = splitWords(transcript, language)
            if (!spokenWords.length) return

            const lastSpoken = spokenWords[spokenWords.length - 1]
            const normalizedSpoken = normalize(lastSpoken)

            if (weight(normalizedSpoken) < 3) return

            const searchEnd = Math.min(searchStartRef.current + 20, scriptWords.length)

            let bestMatch = -1
            let bestScore = 0

            for (let i = searchStartRef.current; i < searchEnd; i++) {
                const normalizedScript = normalize(scriptWords[i])
                if (weight(normalizedScript) < 3) continue

                if (fuzzyMatch(scriptWords[i], lastSpoken)) {
                    const score = normalizedScript.length + normalizedSpoken.length
                    if (score > bestScore) {
                        bestScore = score
                        bestMatch = i
                    }
                }
            }

            if (bestMatch !== -1) {
                searchStartRef.current = Math.max(0, bestMatch - 1)
                setCurrentWordIndex(bestMatch)
            }
        },
        [scriptWords, language],
    )

    const reset = useCallback(() => {
        setCurrentWordIndex(-1)
        searchStartRef.current = 0
    }, [])

    return { currentWordIndex, processTranscript, reset }
}
