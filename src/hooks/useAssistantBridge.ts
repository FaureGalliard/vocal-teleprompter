import { getCurrentWindow } from '@tauri-apps/api/window'
import { applySettings, describeSettings } from '../lib/assistantSettings'
import { scriptTitle } from '../lib/library'
import { splitCards } from '../lib/cards'
import { useMcpBridge } from './useMcpBridge'
import { DEFAULT_WPM, type usePace } from './usePace'
import type { useListeningSession } from './useListeningSession'
import type { Settings } from './useSettings'
import type { useLibrary } from './useLibrary'

const minutesFor = (words: number) => Math.round((words / DEFAULT_WPM) * 10) / 10

// Answers requests from AI assistants through the MCP connector: load or read
// the script, list and open saved scripts, report status, change settings
// and drive the prompter
export function useAssistantBridge({
    settings,
    session,
    content,
    loadScript,
    currentCard,
    currentWordIndex,
    pace,
    goToCard,
    library,
    openScript,
}: {
    settings: Settings
    session: ReturnType<typeof useListeningSession>
    content: string
    // Puts a script on screen: a new one in the library, or (`asNew` false)
    // the current one changed
    loadScript: (text: string, asNew?: boolean) => void
    currentCard: number
    currentWordIndex: number
    pace: ReturnType<typeof usePace>
    goToCard: (index: number) => void
    library: ReturnType<typeof useLibrary>
    openScript: (id: string) => void
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
            loadScript(next, mode !== 'append')
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
                settings: { ...describeSettings(settings), windowVisible: !document.hidden },
            }
        },
        update_settings: (changes) => {
            requireConnector()
            const { applied, ignored } = applySettings(settings, changes)
            if (!applied.length)
                throw new Error(`Nothing to change. Invalid or unknown: ${ignored.join(', ')}`)
            return { applied, ignored }
        },
        list_scripts: () => {
            requireConnector()
            return {
                scripts: library.scripts.map((saved) => ({
                    id: saved.id,
                    title: scriptTitle(saved.text),
                    ...describeScript(saved.text),
                    updatedAt: new Date(saved.updatedAt).toISOString(),
                    onScreen: saved.id === library.currentId,
                })),
            }
        },
        open_script: ({ id }) => {
            requireConnector()
            const saved = library.scripts.find((s) => s.id === id)
            if (!saved) throw new Error(`No saved script with id ${String(id)}. Use list_scripts.`)
            openScript(saved.id)
            return {
                opened: saved.id,
                title: scriptTitle(saved.text),
                ...describeScript(saved.text),
            }
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
