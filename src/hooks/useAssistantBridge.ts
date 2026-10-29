import { getCurrentWindow } from '@tauri-apps/api/window'
import { LANGUAGES } from '../constants/languages'
import { splitCards } from '../lib/cards'
import { useMcpBridge } from './useMcpBridge'
import { DEFAULT_WPM, type usePace } from './usePace'
import type { useListeningSession } from './useListeningSession'
import type { Settings } from './useSettings'

const minutesFor = (words: number) => Math.round((words / DEFAULT_WPM) * 10) / 10

// Answers requests from AI assistants through the MCP connector: load or read
// the script, report status, change settings and drive the prompter
export function useAssistantBridge({
    settings,
    session,
    content,
    loadScript,
    currentCard,
    currentWordIndex,
    pace,
    goToCard,
}: {
    settings: Settings
    session: ReturnType<typeof useListeningSession>
    content: string
    // Replaces the script, out of editing and back at its start
    loadScript: (text: string) => void
    currentCard: number
    currentWordIndex: number
    pace: ReturnType<typeof usePace>
    goToCard: (index: number) => void
}) {
    const describeScript = (text: string) => {
        const scriptCards = splitCards(text, settings.language)
        const words = scriptCards.reduce((sum, c) => sum + c.wordCount, 0)
        return { slides: scriptCards.length, words, estimatedMinutes: minutesFor(words) }
    }
    const requireConnector = () => {
        if (!settings.aiConnectorEnabled)
            throw new Error(
                'The AI connector is turned off in Vocal Teleprompter. Ask the user to turn it on in Settings.',
            )
    }

    useMcpBridge({
        load_script: ({ text, mode }) => {
            requireConnector()
            if (typeof text !== 'string' || !text.trim())
                throw new Error('text must be a non-empty string')
            const next =
                mode === 'append' && content.trim()
                    ? `${content.trimEnd()}\n\n---\n\n${text}`
                    : text
            session.stopListening()
            loadScript(next)
            return { loaded: true, ...describeScript(next) }
        },
        get_script: () => {
            requireConnector()
            return { text: content, ...describeScript(content) }
        },
        get_status: () => {
            requireConnector()
            return {
                ...describeScript(content),
                speechLanguage: settings.language,
                targetMinutes: settings.targetMinutes || null,
                listening: session.isSpeechActive,
                paused: session.isPaused,
                countingDown: session.countdown !== null,
                currentSlide: currentCard + 1,
                spokenWords: currentWordIndex + 1,
                elapsedSeconds: Math.round(pace.elapsedMs / 1000),
                wordsPerMinute: pace.wpm === null ? null : Math.round(pace.wpm),
                remainingMinutes: Math.round((pace.remainingMs / 60000) * 10) / 10,
                pace: pace.status,
                settings: {
                    hideFromScreenSharing: settings.hiddenFromCapture,
                    fontSize: settings.fontSize,
                    countdownSeconds: settings.countdownSeconds,
                    readingLine: settings.readingLine,
                    autoContrast: settings.autoContrast,
                    clickThrough: settings.clickThrough,
                    windowVisible: !document.hidden,
                },
            }
        },
        update_settings: (changes) => {
            requireConnector()
            const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
            const isInt = (v: unknown, min: number, max: number): v is number =>
                Number.isInteger(v) && (v as number) >= min && (v as number) <= max
            const applied: string[] = []
            const apply = <T>(key: string, ok: boolean, set: (v: T) => void) => {
                if (!ok) return
                set(changes[key] as T)
                applied.push(key)
            }
            apply(
                'hideFromScreenSharing',
                isBool(changes.hideFromScreenSharing),
                settings.setHiddenFromCapture,
            )
            apply('fontSize', isInt(changes.fontSize, 6, 200), settings.setFontSize)
            apply('targetMinutes', isInt(changes.targetMinutes, 0, 180), settings.setTargetMinutes)
            apply(
                'countdownSeconds',
                isInt(changes.countdownSeconds, 0, 10),
                settings.setCountdownSeconds,
            )
            apply('readingLine', isBool(changes.readingLine), settings.setReadingLine)
            apply('autoContrast', isBool(changes.autoContrast), settings.setAutoContrast)
            apply('clickThrough', isBool(changes.clickThrough), settings.setClickThrough)
            apply(
                'speechLanguage',
                LANGUAGES.some((l) => l.value === changes.speechLanguage),
                settings.setLanguage,
            )
            const ignored = Object.keys(changes).filter((k) => !applied.includes(k))
            if (!applied.length)
                throw new Error(`Nothing to change. Invalid or unknown: ${ignored.join(', ')}`)
            return { applied, ignored }
        },
        control: ({ action }) => {
            requireConnector()
            const win = getCurrentWindow()
            switch (action) {
                case 'start':
                    if (!content.trim()) throw new Error('There is no script to read yet')
                    if (!session.isSpeechActive) session.startListening()
                    break
                case 'pause':
                    session.setIsPaused(true)
                    break
                case 'resume':
                    session.setIsPaused(false)
                    break
                case 'stop':
                    session.stopListening()
                    break
                case 'next_slide':
                    goToCard(currentCard + 1)
                    break
                case 'previous_slide':
                    goToCard(currentCard - 1)
                    break
                case 'show_window':
                    win.show()
                        .then(() => win.setFocus())
                        .catch(() => {})
                    break
                case 'hide_window':
                    win.hide().catch(() => {})
                    break
                default:
                    throw new Error(`Unknown action: ${String(action)}`)
            }
            return { done: action }
        },
    })
}
