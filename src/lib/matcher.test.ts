import { describe, expect, it } from 'vitest'
import { nextPosition, normalize, similar } from './matcher'
import { splitWords } from './segment'

const words = (text: string, language = 'en-US') =>
    splitWords(text, language).map(normalize).filter(Boolean)

// Feeds the recognizer's output the way it arrives: each utterance grows
// word by word (partial results), and a pause starts a new one
function readAloud(script: string, utterances: string[], language = 'en-US') {
    const scriptWords = words(script, language)
    let current = -1
    const positions: number[] = []
    for (const utterance of utterances) {
        const spoken = words(utterance, language)
        for (let n = 1; n <= spoken.length; n++) {
            current = nextPosition(scriptWords, spoken.slice(0, n), current)
            positions.push(current)
        }
    }
    return { current, last: scriptWords.length - 1, positions }
}

const SCRIPT =
    'Good morning everyone. Today I want to show you how we cut our delivery times in half. It started with a simple question: where were we actually losing time?'

describe('normalize', () => {
    it('drops case, accents and punctuation', () => {
        expect(normalize('¿Qué?')).toBe('que')
        expect(normalize('Árbol,')).toBe('arbol')
        expect(normalize('ÉCOLE')).toBe('ecole')
    })

    it('keeps non-Latin letters', () => {
        expect(normalize('天気')).toBe('天気')
        expect(normalize('안녕')).not.toBe('')
    })
})

describe('similar', () => {
    it('accepts small mispronunciations of longer words', () => {
        expect(similar('delivery', 'delivry')).toBe(true)
        expect(similar('question', 'questoin')).toBe(true)
    })

    it('is strict with short words', () => {
        expect(similar('cut', 'cat')).toBe(false)
        expect(similar('in', 'on')).toBe(false)
    })

    it('accepts a word that is still being spoken', () => {
        expect(similar('presentation', 'present')).toBe(true)
    })
})

describe('nextPosition', () => {
    it('follows a script read straight through to the last word', () => {
        const { current, last } = readAloud(SCRIPT, [SCRIPT])
        expect(current).toBe(last)
    })

    it('follows the speech split into several utterances', () => {
        const { current, last } = readAloud(SCRIPT, [
            'good morning everyone',
            'today i want to show you how we cut our delivery times in half',
            'it started with a simple question where were we actually losing time',
        ])
        expect(current).toBe(last)
    })

    it('never moves backwards while reading', () => {
        const { positions } = readAloud(SCRIPT, [SCRIPT])
        for (let i = 1; i < positions.length; i++)
            expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1])
    })

    // What Vosk returned for the English test recording (src-tauri/tests/fixtures)
    it('follows the real recognizer output of the test recording', () => {
        const { current, last } = readAloud(SCRIPT, [
            'good morning everyone today i want to show you how we cut our delivery times in half',
            'it started with a simple question where where we actually losing time',
        ])
        expect(current).toBe(last)
    })

    it('keeps up when a few words are misheard or skipped', () => {
        const { current, last } = readAloud(SCRIPT, [
            'good morning every one today i want to show how we cut our delivry times in half',
            'it started with simple question where were we actually loosing time',
        ])
        expect(current).toBe(last)
    })

    it('does not jump ahead to a repeated word further on', () => {
        const script = 'We start with the plan. Then the budget. Then the plan again, in detail.'
        const scriptWords = words(script)
        // Having said "we start with the plan", the first "plan" is the match
        const at = readAloud(script, ['we start with the plan']).current
        expect(scriptWords[at]).toBe('plan')
        expect(at).toBe(4)
    })

    it('does not jump a line ahead on one distinctive word said again later', () => {
        const scriptWords = words(SCRIPT)
        // At "everyone" (2), a lone "delivery" (word 12) must not be followed
        expect(nextPosition(scriptWords, words('delivery'), 2)).toBe(2)
    })

    it('still follows a lone word right after the current one', () => {
        const scriptWords = words(SCRIPT)
        expect(nextPosition(scriptWords, words('today'), 2)).toBe(3)
    })

    it('jumps ahead when two words in a row line up', () => {
        const scriptWords = words(SCRIPT)
        expect(nextPosition(scriptWords, words('delivery times'), 2)).toBe(14)
    })

    it('comes back after a mistaken jump when the speaker keeps reading', () => {
        const scriptWords = words(SCRIPT)
        // The marker ran ahead to "question" (24) while the speaker is still at
        // "how we cut our delivery": three words in a row bring it back
        let current = 24
        for (const n of [1, 2, 3])
            current = nextPosition(scriptWords, words('we cut our').slice(0, n), current)
        expect(scriptWords[current]).toBe('our')
    })

    it('does not move back on a single repeated word', () => {
        const scriptWords = words(SCRIPT)
        expect(nextPosition(scriptWords, words('time'), 24)).toBe(24)
    })

    it('does not move on a lone common word far ahead', () => {
        const scriptWords = words(SCRIPT)
        expect(nextPosition(scriptWords, words('a'), -1)).toBe(-1)
    })

    it('ignores accents and case in Spanish', () => {
        const script =
            'Buenos días a todos. Hoy les voy a mostrar cómo reducimos el tiempo de entrega a la mitad.'
        const { current, last } = readAloud(
            script,
            [
                'buenos dias a todos',
                'hoy les voy a mostrar como reducimos el tiempo de entrega a la mitad',
            ],
            'es-ES',
        )
        expect(current).toBe(last)
    })

    // What Vosk returned for the Spanish test recording, with its slips
    // (reducimos for redujimos, a stray accent, a missing one)
    it('follows the real recognizer output of the Spanish recording', () => {
        const script =
            'Buenos días a todos. Hoy les quiero mostrar cómo redujimos a la mitad nuestros tiempos de entrega. Todo empezó con una pregunta muy simple: ¿dónde estábamos perdiendo tiempo de verdad?'
        const { current, last } = readAloud(
            script,
            [
                'buenos días a todos hoy les quiero mostrar cómo reducimos á la mitad nuestros tiempos de entrega',
                'todo empezó con una pregunta muy simple donde estábamos perdiendo tiempo de verdad',
            ],
            'es-ES',
        )
        expect(current).toBe(last)
    })

    it('follows Japanese, which is written without spaces', () => {
        const script = '今日はいい天気ですね。散歩に行きましょう。'
        const { current, last } = readAloud(
            script,
            ['今日はいい天気ですね', '散歩に行きましょう'],
            'ja-JP',
        )
        expect(current).toBe(last)
    })
})
