export interface Segment {
    text: string
    // Position in the word list, or -1 for spaces and punctuation
    word: number
}

const segmenters = new Map<string, Intl.Segmenter>()

function getSegmenter(language: string): Intl.Segmenter {
    let segmenter = segmenters.get(language)
    if (!segmenter) {
        segmenter = new Intl.Segmenter(language, { granularity: 'word' })
        segmenters.set(language, segmenter)
    }
    return segmenter
}

// Splits text into words and the gaps between them. Uses the locale-aware
// segmenter so languages written without spaces (Japanese, Chinese) still
// get word boundaries.
export function segmentText(text: string, language: string): Segment[] {
    let index = 0
    if (typeof Intl.Segmenter !== 'function') {
        return text
            .split(/(\s+)/)
            .filter(Boolean)
            .map((t) => ({ text: t, word: /\s/.test(t[0]) ? -1 : index++ }))
    }
    return Array.from(getSegmenter(language).segment(text), (s) => ({
        text: s.segment,
        word: s.isWordLike ? index++ : -1,
    }))
}

export function splitWords(text: string, language: string): string[] {
    return segmentText(text, language)
        .filter((s) => s.word !== -1)
        .map((s) => s.text)
}
