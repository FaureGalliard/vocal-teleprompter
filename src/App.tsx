import { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import Toolbar from './components/Toolbar'
import { OpenTowardsContext } from './components/Popover'
import { BAR_ROOM, useWindowExpansion } from './hooks/useWindowExpansion'
import { useWindowPlacement } from './hooks/useWindowPlacement'
import AppearancePanel from './components/AppearancePanel'
import SettingsPanel from './components/SettingsPanel'
import Canvas from './components/Canvas'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useScriptMatcher } from './hooks/useScriptMatcher'
import { useMicrophones } from './hooks/useMicrophones'
import { useMicLevel } from './hooks/useMicLevel'
import { useSpeechModel } from './hooks/useSpeechModel'
import ModelDownloadCard from './components/ModelDownloadCard'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Menu, X } from 'lucide-react'
import { startTour } from './lib/tour'
import { splitCards, currentCardIndex } from './lib/cards'
import StatusBar from './components/StatusBar'
import { usePace } from './hooks/usePace'
import {
    GLOBAL_SHORTCUTS,
    useGlobalShortcuts,
    type GlobalAction,
} from './hooks/useGlobalShortcuts'
import { useUpdater } from './hooks/useUpdater'
import UpdateBanner from './components/UpdateBanner'
import CountdownOverlay from './components/CountdownOverlay'
import { DEFAULT_TYPOGRAPHY, type Typography } from './lib/typography'
import { DEFAULT_SCROLLING, type Scrolling } from './lib/scrolling'
import { useMcpBridge } from './hooks/useMcpBridge'
import { DEFAULT_WPM } from './hooks/usePace'
import { LANGUAGES } from './constants/languages'
import { usePersistentState, clearPersistentState } from './hooks/usePersistentState'
import { DEFAULT_UI_LANGUAGE, I18nProvider, UI_LANGUAGES, getMessages } from './i18n'
import { bestOutline, ensureContrast } from './lib/contrast'

// Speech language matching the system's, so a first run listens in the
// language the user most likely speaks
const systemSpeechLanguage =
    LANGUAGES.find((l) => l.value.split('-')[0] === navigator.language.split('-')[0])?.value ??
    'en-US'

// Below this background opacity the backdrop shows through enough to need a halo
const HALO_BELOW_OPACITY = 0.85

function App() {
    const [uiLanguage, setUiLanguage] = usePersistentState<string>(
        'uiLanguage',
        DEFAULT_UI_LANGUAGE,
    )
    const t = getMessages(uiLanguage)
    const [bgOpacity, setBgOpacity] = usePersistentState('bgOpacity', 0.9)
    const [bgColor, setBgColor] = usePersistentState('bgColor', '#0a0000')
    const [textColor, setTextColor] = usePersistentState('textColor', '#7698fe')
    const [autoContrast, setAutoContrast] = usePersistentState('autoContrast', true)
    const [titleBarPosition, setTitleBarPosition] = usePersistentState<'top' | 'bottom'>(
        'titleBarPosition',
        'top',
    )
    const [titleBarVisible, setTitleBarVisible] = usePersistentState('titleBarVisible', true)
    const [toolbarVisible, setToolbarVisible] = useState(false)
    const [titleBarHeight, setTitleBarHeight] = useState(0)
    const [content, setContent] = usePersistentState('content', t.sampleScript)
    const [fontSize, setFontSize] = usePersistentState('fontSize', 16)
    const [typography, setTypography] = usePersistentState<Typography>(
        'typography',
        DEFAULT_TYPOGRAPHY,
    )
    // Keep the window out of screen shares and recordings (Zoom, Meet, OBS...)
    const [hiddenFromCapture, setHiddenFromCapture] = usePersistentState(
        'hiddenFromCapture',
        true,
    )
    const [isSpeechActive, setIsSpeechActive] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isAdjusting, setIsAdjusting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editCaret, setEditCaret] = useState<number | null>(null)
    const [tourActive, setTourActive] = useState(false)
    const [tourSeen, setTourSeen] = usePersistentState('tourSeen', false)
    // Minutes the speaker wants the presentation to last; 0 means no target
    const [targetMinutes, setTargetMinutes] = usePersistentState('targetMinutes', 0)
    const [readingLine, setReadingLine] = usePersistentState('readingLine', false)
    const [scrolling, setScrolling] = usePersistentState<Scrolling>('scrolling', DEFAULT_SCROLLING)
    // Clicks go to whatever is behind the window. Not saved, so a restart
    // always brings the window back to normal
    const [clickThrough, setClickThrough] = useState(false)
    const [autoUpdate, setAutoUpdate] = usePersistentState('autoUpdate', true)
    const updater = useUpdater(autoUpdate)
    const [shortcutsEnabled, setShortcutsEnabled] = usePersistentState('shortcutsEnabled', true)
    // Only the rebound ones are saved, so new defaults reach everyone else
    const [shortcutOverrides, setShortcutOverrides] = usePersistentState<
        Partial<Record<GlobalAction, string>>
    >('shortcutOverrides', {})
    const shortcutBindings = { ...GLOBAL_SHORTCUTS, ...shortcutOverrides }
    const [recordingShortcut, setRecordingShortcut] = useState(false)
    // Seconds counted down before listening starts; 0 starts right away
    const [countdownSeconds, setCountdownSeconds] = usePersistentState('countdownSeconds', 3)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [aiConnectorEnabled, setAiConnectorEnabled] = usePersistentState('aiConnector', true)
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const cancelCountdown = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
        setCountdown(null)
    }

    // Start a fresh session, after the countdown when one is set. Resuming from
    // a pause goes through setIsPaused instead and skips it.
    const startListening = async () => {
        if (countdownTimerRef.current || speechModel.downloading) return
        // The first time in a language, fetch its speech model, then go on
        if (speechModel.installed !== true && !(await speechModel.download())) return
        setIsEditing(false)
        setIsPaused(false)
        if (countdownSeconds <= 0) {
            setIsSpeechActive(true)
            return
        }
        let left = countdownSeconds
        setCountdown(left)
        countdownTimerRef.current = setInterval(() => {
            left -= 1
            if (left > 0) {
                setCountdown(left)
                return
            }
            cancelCountdown()
            setIsSpeechActive(true)
        }, 1000)
    }

    useEffect(() => cancelCountdown, [])

    const handleAdjustStart = () => {
        setIsAdjusting(true)
        const onUp = () => {
            setIsAdjusting(false)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchend', onUp)
        }
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchend', onUp)
    }

    const [language, setLanguage] = usePersistentState<string>('language', systemSpeechLanguage)
    const [langMenuOpen, setLangMenuOpen] = useState(false)
    const [micMenuOpen, setMicMenuOpen] = useState(false)
    const titleBarRef = useRef<HTMLDivElement>(null)
    const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isDraggingRef = useRef(false)

    const { microphones, refresh: refreshMicrophones } = useMicrophones()
    // null listens to the system default input
    const [selectedMic, setSelectedMic] = usePersistentState<string | null>('microphoneId', null)
    // A remembered microphone may have been unplugged since last time
    const activeMic = microphones.some((m) => m.id === selectedMic) ? selectedMic : null
    const speechModel = useSpeechModel(language)
    // Fetch a missing model as soon as its language is picked, not only on Start
    useEffect(() => {
        if (speechModel.installed === false && !speechModel.downloading && !speechModel.failed)
            speechModel.download()
    }, [speechModel.installed])
    const cards = useMemo(() => splitCards(content, language), [content, language])
    const scriptWords = useMemo(
        () => cards.flatMap((c) => c.segments.filter((s) => s.word !== -1).map((s) => s.text)),
        [cards],
    )
    const { currentWordIndex, heard, processTranscript, reset, jumpTo } = useScriptMatcher(
        scriptWords,
        language,
    )
    const {
        listening: isRecognizing,
        error,
        heard: heardText,
    } = useSpeechRecognition({
        language,
        deviceId: activeMic,
        vocabulary: scriptWords,
        onTranscript: processTranscript,
        enabled: isSpeechActive && !isPaused,
    })

    // Measured while the microphone menu is open, to test the input
    const micLevel = useMicLevel(micMenuOpen, isRecognizing, activeMic)

    const currentCard = currentCardIndex(cards, currentWordIndex)
    const pace = usePace({
        running: isSpeechActive && !isPaused,
        sessionActive: isSpeechActive,
        spokenWords: currentWordIndex + 1,
        totalWords: scriptWords.length,
        targetMinutes,
    })
    // Land just before the card's first word so that word is the next one to read
    const goToCard = (index: number) => {
        const card = cards[Math.max(0, Math.min(index, cards.length - 1))]
        if (card) jumpTo(card.firstWord - 1)
    }

    const { failed: failedShortcuts } = useGlobalShortcuts({
        enabled: shortcutsEnabled && !recordingShortcut,
        bindings: shortcutBindings,
        handlers: {
            toggleListening: () => {
                if (!content || isEditing) return
                if (isSpeechActive) setIsPaused((v) => !v)
                else if (countdown !== null) cancelCountdown()
                else startListening()
            },
            nextCard: () =>
                cards.length > 1 ? goToCard(currentCard + 1) : jumpTo(currentWordIndex + 10),
            previousCard: () =>
                cards.length > 1 ? goToCard(currentCard - 1) : jumpTo(currentWordIndex - 10),
            toggleClickThrough: () => setClickThrough((v) => !v),
            toggleWindow: async () => {
                const win = getCurrentWindow()
                if (await win.isVisible()) await win.hide()
                else {
                    await win.show()
                    await win.setFocus()
                }
            },
        },
    })

    const stopListening = () => {
        cancelCountdown()
        setIsSpeechActive(false)
        setIsPaused(false)
    }

    // Requests from AI assistants through the MCP connector
    const minutesFor = (words: number) => Math.round((words / DEFAULT_WPM) * 10) / 10
    const describeScript = (text: string) => {
        const scriptCards = splitCards(text, language)
        const words = scriptCards.reduce((sum, c) => sum + c.wordCount, 0)
        return { slides: scriptCards.length, words, estimatedMinutes: minutesFor(words) }
    }
    const requireConnector = () => {
        if (!aiConnectorEnabled)
            throw new Error(
                'The AI connector is turned off in Vocal Teleprompter. Ask the user to turn it on in Settings.',
            )
    }
    useMcpBridge({
        load_script: ({ text, mode }) => {
            requireConnector()
            if (typeof text !== 'string' || !text.trim()) throw new Error('text must be a non-empty string')
            const next =
                mode === 'append' && content.trim() ? `${content.trimEnd()}\n\n---\n\n${text}` : text
            stopListening()
            setIsEditing(false)
            setContent(next)
            reset()
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
                speechLanguage: language,
                targetMinutes: targetMinutes || null,
                listening: isSpeechActive,
                paused: isPaused,
                countingDown: countdown !== null,
                currentSlide: currentCard + 1,
                spokenWords: currentWordIndex + 1,
                elapsedSeconds: Math.round(pace.elapsedMs / 1000),
                wordsPerMinute: pace.wpm === null ? null : Math.round(pace.wpm),
                remainingMinutes: Math.round((pace.remainingMs / 60000) * 10) / 10,
                pace: pace.status,
                settings: {
                    hideFromScreenSharing: hiddenFromCapture,
                    fontSize,
                    countdownSeconds,
                    readingLine,
                    autoContrast,
                    clickThrough,
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
            if (isBool(changes.hideFromScreenSharing)) {
                setHiddenFromCapture(changes.hideFromScreenSharing)
                applied.push('hideFromScreenSharing')
            }
            if (isInt(changes.fontSize, 6, 200)) {
                setFontSize(changes.fontSize)
                applied.push('fontSize')
            }
            if (isInt(changes.targetMinutes, 0, 180)) {
                setTargetMinutes(changes.targetMinutes)
                applied.push('targetMinutes')
            }
            if (isInt(changes.countdownSeconds, 0, 10)) {
                setCountdownSeconds(changes.countdownSeconds)
                applied.push('countdownSeconds')
            }
            if (isBool(changes.readingLine)) {
                setReadingLine(changes.readingLine)
                applied.push('readingLine')
            }
            if (isBool(changes.autoContrast)) {
                setAutoContrast(changes.autoContrast)
                applied.push('autoContrast')
            }
            if (isBool(changes.clickThrough)) {
                setClickThrough(changes.clickThrough)
                applied.push('clickThrough')
            }
            if (LANGUAGES.some((l) => l.value === changes.speechLanguage)) {
                setLanguage(changes.speechLanguage as string)
                applied.push('speechLanguage')
            }
            const ignored = Object.keys(changes).filter((k) => !applied.includes(k))
            if (!applied.length) throw new Error(`Nothing to change. Invalid or unknown: ${ignored.join(', ')}`)
            return { applied, ignored }
        },
        control: ({ action }) => {
            requireConnector()
            switch (action) {
                case 'start':
                    if (!content.trim()) throw new Error('There is no script to read yet')
                    if (!isSpeechActive) startListening()
                    break
                case 'pause':
                    setIsPaused(true)
                    break
                case 'resume':
                    setIsPaused(false)
                    break
                case 'stop':
                    stopListening()
                    break
                case 'next_slide':
                    goToCard(currentCard + 1)
                    break
                case 'previous_slide':
                    goToCard(currentCard - 1)
                    break
                case 'show_window':
                    getCurrentWindow()
                        .show()
                        .then(() => getCurrentWindow().setFocus())
                        .catch(() => {})
                    break
                case 'hide_window':
                    getCurrentWindow()
                        .hide()
                        .catch(() => {})
                    break
                default:
                    throw new Error(`Unknown action: ${String(action)}`)
            }
            return { done: action }
        },
    })

    useLayoutEffect(() => {
        if (titleBarRef.current) {
            setTitleBarHeight(titleBarRef.current.offsetHeight)
        }
    }, [titleBarVisible, titleBarPosition])

    const handleMouseDown = async () => {
        isDraggingRef.current = false
        dragTimeoutRef.current = setTimeout(async () => {
            isDraggingRef.current = true
            const win = getCurrentWindow()
            await win.startDragging()
        }, 120)
    }

    const handleMouseUp = () => {
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current)
            dragTimeoutRef.current = null
        }
    }

    const handleClick = () => {
        if (!isDraggingRef.current) {
            setToolbarVisible((v) => !v)
        }
    }

    const handlePasteText = async () => {
        try {
            const text = await readText()
            if (text) {
                setContent(text)
                reset()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleImport = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: t.textFiles, extensions: ['txt'] }],
            })
            if (selected) {
                const text = await readTextFile(selected as string)
                setContent(text)
                reset()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleClear = () => {
        setContent('')
        reset()
        setIsSpeechActive(false)
        setIsPaused(false)
    }

    // Listening and editing exclude each other: the script must hold still
    const handleToggleEdit = () => {
        setEditCaret(null)
        setIsEditing((v) => !v)
        setIsSpeechActive(false)
        setIsPaused(false)
    }

    const handleToggleListen = () => {
        if (countdown !== null) {
            cancelCountdown()
            return
        }
        if (isSpeechActive) {
            setIsSpeechActive(false)
            setIsPaused(false)
            reset()
        } else {
            startListening()
        }
    }

    useEffect(() => {
        document.documentElement.lang = uiLanguage
        invoke('set_tray_labels', { ...t.tray }).catch((e) => console.error(e))
    }, [uiLanguage, t])

    useEffect(() => {
        getCurrentWindow()
            .setIgnoreCursorEvents(clickThrough)
            .catch((e) => console.error(e))
        // Nothing in the toolbar can be clicked anyway
        if (clickThrough) setToolbarVisible(false)
    }, [clickThrough])

    useEffect(() => {
        const unlisten = listen('toggle-click-through', () => setClickThrough((v) => !v))
        return () => {
            unlisten.then((off) => off())
        }
    }, [])

    useEffect(() => {
        getCurrentWindow()
            .setContentProtected(hiddenFromCapture)
            .catch((e) => console.error(e))
    }, [hiddenFromCapture])

    // The tour points at toolbar controls, so open the toolbar and give the
    // window time to grow for it and the toolbar to slide in before starting
    const showTutorial = () => {
        setIsEditing(false)
        setIsSpeechActive(false)
        setIsPaused(false)
        setLangMenuOpen(false)
        setMicMenuOpen(false)
        setToolbarVisible(true)
        setTourActive(true)
        setTimeout(
            () =>
                startTour(t, () => {
                    setTourActive(false)
                    setTourSeen(true)
                }),
            700,
        )
    }

    // First launch: show the tour once (the ref keeps StrictMode from starting two)
    const tourAutoStartedRef = useRef(false)
    useEffect(() => {
        if (tourSeen || tourAutoStartedRef.current) return
        tourAutoStartedRef.current = true
        showTutorial()
    }, [])

    // Keyboard shortcuts, ignored while typing in a field
    useEffect(() => {
        const isTyping = (target: EventTarget | null) =>
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement

        const onKeyDown = (e: KeyboardEvent) => {
            if (
                e.ctrlKey ||
                e.metaKey ||
                e.altKey ||
                isTyping(e.target) ||
                isEditing ||
                tourActive
            )
                return
            switch (e.key) {
                case ' ':
                    if (!content) return
                    if (isSpeechActive) setIsPaused((v) => !v)
                    else if (countdown !== null) cancelCountdown()
                    else startListening()
                    break
                case 'Escape':
                    if (countdown !== null) {
                        cancelCountdown()
                        break
                    }
                    if (!isSpeechActive) return
                    setIsSpeechActive(false)
                    setIsPaused(false)
                    break
                case 'ArrowRight':
                case 'ArrowDown':
                    jumpTo(currentWordIndex + 1)
                    break
                case 'ArrowLeft':
                case 'ArrowUp':
                    jumpTo(currentWordIndex - 1)
                    break
                // With slide cards, page keys move between cards
                case 'PageDown':
                    if (cards.length > 1) goToCard(currentCard + 1)
                    else jumpTo(currentWordIndex + 10)
                    break
                case 'PageUp':
                    if (cards.length > 1) goToCard(currentCard - 1)
                    else jumpTo(currentWordIndex - 10)
                    break
                case '+':
                case '=':
                    setFontSize((v) => Math.min(200, v + 2))
                    break
                case '-':
                    setFontSize((v) => Math.max(6, v - 2))
                    break
                default:
                    return
            }
            e.preventDefault()
        }

        // Keep Space from also clicking whatever button has focus
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ' && !isTyping(e.target)) e.preventDefault()
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [
        content,
        isSpeechActive,
        isEditing,
        tourActive,
        currentWordIndex,
        jumpTo,
        setFontSize,
        cards,
        currentCard,
        countdown,
        countdownSeconds,
    ])

    // With auto contrast the chosen color is nudged until it reads well on the
    // background, and once the background turns see-through (so whatever is
    // behind the window shows) the text gets a halo to stay legible on it
    const displayTextColor = autoContrast ? ensureContrast(textColor, bgColor) : textColor
    const textHalo =
        autoContrast && bgOpacity < HALO_BELOW_OPACITY
            ? bestOutline(displayTextColor)
            : undefined

    const toolbarTopOffset =
        titleBarVisible && titleBarPosition === 'top' ? titleBarHeight : 0

    // Distance from the bottom of the frame to the status row
    const statusBottom = (titleBarVisible && titleBarPosition === 'bottom' ? titleBarHeight : 0) + 6

    // While the toolbar is open the window grows below the teleprompter (or
    // above it), so the toolbar and its panels never cover the text or get
    // cut off. When it cannot grow (maximized) the toolbar sits over the
    // bottom of the text instead, which then makes room for it.
    const { expansion, ready: toolbarReady } = useWindowExpansion(toolbarVisible)
    useWindowPlacement(toolbarVisible || expansion !== null)
    const frameTop = expansion?.side === 'above' ? expansion.room : 0
    const toolbarPlacement: React.CSSProperties = expansion
        ? {
              left: expansion.frame.width / 2,
              top:
                  expansion.side === 'below'
                      ? expansion.frame.height + (BAR_ROOM - 40) / 2
                      : expansion.room - BAR_ROOM + (BAR_ROOM - 40) / 2,
          }
        : { left: '50%', bottom: statusBottom + 30 }
    const openTowards = expansion?.side === 'below' ? 'down' : 'up'
    const bottomInset = toolbarVisible && toolbarReady && !expansion ? BAR_ROOM : 0

    return (
        <I18nProvider language={uiLanguage}>
            <div
                className="font-sans"
                style={{ height: '100vh', overflow: 'hidden' }}>
                <div
                    // The teleprompter frame. Its transform makes it the box that
                    // the fixed-position pieces inside are laid out in, so they
                    // stay put while the window grows around it.
                    style={
                        {
                            position: 'fixed',
                            top: frameTop,
                            left: 0,
                            width: expansion ? expansion.frame.width : '100vw',
                            height: expansion ? expansion.frame.height : '100vh',
                            '--frame-h': expansion ? `${expansion.frame.height}px` : '100vh',
                            transform: 'translateZ(0)',
                            overflow: 'hidden',
                            backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
                            outline: `1px solid ${displayTextColor}`,
                            outlineOffset: '-1px',
                            boxSizing: 'border-box',
                        } as React.CSSProperties
                    }>
                    {titleBarVisible && (
                        <TitleBar
                            ref={titleBarRef}
                            position={titleBarPosition}
                            onPositionChange={setTitleBarPosition}
                        />
                    )}


                    {/* In the status row, clear of the text */}
                    <button
                        data-tour="menu"
                        aria-label={t.tour.menuTitle}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onClick={handleClick}
                        className={`fixed z-50 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors shadow-lg ${
                            toolbarVisible
                                ? 'bg-[#445ade] text-white hover:bg-[#3448c5]'
                                : 'bg-[#1a1a1a] text-white hover:bg-[#3448c5]'
                        }`}
                        style={{ bottom: statusBottom - 2, right: 10 }}>
                        {toolbarVisible ? <X size={14} /> : <Menu size={14} />}
                    </button>

                    <Canvas
                        cards={cards}
                        currentCard={currentCard}
                        currentWordIndex={currentWordIndex}
                        heard={heard}
                        // The clicked word becomes the next one to read
                        onContinueFrom={(index) => jumpTo(index - 1)}
                        onEditAt={(offset) => {
                            setEditCaret(offset)
                            setIsEditing(true)
                        }}
                        isListening={isSpeechActive}
                        editCaret={editCaret}
                        content={content}
                        isEditing={isEditing}
                        onContentChange={setContent}
                        onEditStart={() => {
                            setEditCaret(null)
                            setIsEditing(true)
                        }}
                        onEditEnd={() => setIsEditing(false)}
                        fontSize={fontSize}
                        textColor={displayTextColor}
                        textHalo={textHalo}
                        readingLine={readingLine}
                        scrolling={scrolling}
                        typography={typography}
                        titleBarHeight={titleBarVisible ? titleBarHeight : 0}
                        bottomInset={bottomInset}
                        titleBarPosition={titleBarPosition}
                    />

                    <ModelDownloadCard
                        language={LANGUAGES.find((l) => l.value === language)?.name ?? language}
                        downloading={speechModel.downloading}
                        failed={speechModel.failed}
                        received={speechModel.received}
                        total={speechModel.total}
                        onRetry={() => speechModel.download()}
                    />

                    <CountdownOverlay
                        value={countdown}
                        color={displayTextColor}
                        halo={textHalo}
                    />

                    <UpdateBanner
                        // Out of the way while the toolbar is open; Settings can install too
                        visible={updater.showBanner && !toolbarVisible}
                        top={toolbarTopOffset + 8}
                        version={updater.newVersion}
                        downloading={updater.status === 'downloading'}
                        progress={updater.progress}
                        onInstall={updater.install}
                        onDismiss={updater.dismiss}
                    />

                    {!isEditing && (
                        <StatusBar
                            bottom={statusBottom}
                            cardCount={cards.length}
                            currentCard={currentCard}
                            onPreviousCard={() => goToCard(currentCard - 1)}
                            onNextCard={() => goToCard(currentCard + 1)}
                            sessionActive={isSpeechActive}
                            targetMinutes={targetMinutes}
                            {...pace}
                            clickThrough={clickThrough}
                            heard={isSpeechActive && !isPaused ? heardText : ''}
                            error={error ? (t.errors[error] ?? error) : null}
                        />
                    )}
                </div>

                <OpenTowardsContext.Provider value={openTowards}>
                <Toolbar
                    // Shown once the window has made room, so it does not
                    // flash over the text first
                    visible={toolbarVisible && toolbarReady}
                    isAdjusting={isAdjusting}
                    placement={toolbarPlacement}
                    isRecognizing={isRecognizing}
                    isSpeechActive={isSpeechActive}
                    isPaused={isPaused}
                    content={content}
                    language={language}
                    langMenuOpen={langMenuOpen}
                    micMenuOpen={micMenuOpen}
                    microphones={microphones}
                    selectedMic={activeMic}
                    micLevel={micLevel}
                    onMicChange={(id) => {
                        setSelectedMic(id)
                        setMicMenuOpen(false)
                    }}
                    onPasteText={handlePasteText}
                    onImport={handleImport}
                    onClear={handleClear}
                    isEditing={isEditing}
                    onToggleEdit={handleToggleEdit}
                    onToggleListen={handleToggleListen}
                    onTogglePause={() => setIsPaused((v) => !v)}
                    onShowTutorial={showTutorial}
                    isCountingDown={countdown !== null}
                    isDownloadingModel={speechModel.downloading}
                    onLanguageChange={(val) => {
                        setLanguage(val)
                        setLangMenuOpen(false)
                    }}
                    onLangMenuToggle={() => {
                        setLangMenuOpen((v) => !v)
                        setMicMenuOpen(false)
                    }}
                    onMicMenuToggle={() => {
                        if (!micMenuOpen) refreshMicrophones()
                        setMicMenuOpen((v) => !v)
                        setLangMenuOpen(false)
                    }}
                    appearance={
                        <AppearancePanel
                            fontSize={fontSize}
                            bgColor={bgColor}
                            bgOpacity={bgOpacity}
                            textColor={textColor}
                            onBgColorChange={setBgColor}
                            onBgOpacityChange={setBgOpacity}
                            onTextColorChange={setTextColor}
                            typography={typography}
                            onTypographyChange={setTypography}
                            autoContrast={autoContrast}
                            onToggleAutoContrast={() => setAutoContrast((v) => !v)}
                            onAdjustStart={() => handleAdjustStart()}
                            onFontSizeChange={setFontSize}
                        />
                    }
                    settings={
                        <SettingsPanel
                            titleBarVisible={titleBarVisible}
                            hiddenFromCapture={hiddenFromCapture}
                            uiLanguage={uiLanguage}
                            onUiLanguageChange={(val) => {
                                // Swap the welcome script along with the language, unless it was edited
                                if (UI_LANGUAGES.some((l) => l.messages.sampleScript === content)) {
                                    setContent(getMessages(val).sampleScript)
                                    reset()
                                }
                                setUiLanguage(val)
                            }}
                            onToggleTitleBar={() => setTitleBarVisible((v) => !v)}
                            onShowTutorial={showTutorial}
                            targetMinutes={targetMinutes}
                            onTargetMinutesChange={setTargetMinutes}
                            readingLine={readingLine}
                            onToggleReadingLine={() => setReadingLine((v) => !v)}
                            scrolling={scrolling}
                            onScrollingChange={setScrolling}
                            clickThrough={clickThrough}
                            onToggleClickThrough={() => setClickThrough((v) => !v)}
                            autoUpdate={autoUpdate}
                            onToggleAutoUpdate={() => setAutoUpdate((v) => !v)}
                            updater={updater}
                            shortcutsEnabled={shortcutsEnabled}
                            shortcutBindings={shortcutBindings}
                            failedShortcuts={failedShortcuts}
                            onToggleShortcuts={() => setShortcutsEnabled((v) => !v)}
                            onShortcutChange={(action, accelerator) =>
                                setShortcutOverrides((o) =>
                                    accelerator === GLOBAL_SHORTCUTS[action]
                                        ? Object.fromEntries(
                                              Object.entries(o).filter(([a]) => a !== action),
                                          )
                                        : { ...o, [action]: accelerator },
                                )
                            }
                            onResetShortcuts={() => setShortcutOverrides({})}
                            onRecordingShortcut={setRecordingShortcut}
                            countdownSeconds={countdownSeconds}
                            onCountdownSecondsChange={setCountdownSeconds}
                            aiConnectorEnabled={aiConnectorEnabled}
                            onToggleAiConnector={() => setAiConnectorEnabled((v) => !v)}
                            onReset={() => {
                                clearPersistentState()
                                window.location.reload()
                            }}
                            onToggleHiddenFromCapture={() => setHiddenFromCapture((v) => !v)}
                        />
                    }
                />
                </OpenTowardsContext.Provider>
            </div>
        </I18nProvider>
    )
}

export default App
