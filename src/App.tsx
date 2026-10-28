import { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useScriptMatcher } from './hooks/useScriptMatcher'
import { useMicrophones } from './hooks/useMicrophones'
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
import { usePersistentState, clearPersistentState } from './hooks/usePersistentState'
import { DEFAULT_UI_LANGUAGE, I18nProvider, UI_LANGUAGES, getMessages } from './i18n'
import { bestOutline, ensureContrast } from './lib/contrast'

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
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const cancelCountdown = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
        setCountdown(null)
    }

    // Start a fresh session, after the countdown when one is set. Resuming from
    // a pause goes through setIsPaused instead and skips it.
    const startListening = () => {
        if (countdownTimerRef.current) return
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

    const handleColorPickerOpen = () => setIsAdjusting(true)
    const handleColorPickerClose = () => setIsAdjusting(false)
    const [language, setLanguage] = usePersistentState('language', 'en-US')
    const [langMenuOpen, setLangMenuOpen] = useState(false)
    const [micMenuOpen, setMicMenuOpen] = useState(false)
    const [selectedMic, setSelectedMic] = usePersistentState('microphone', 'default')
    const titleBarRef = useRef<HTMLDivElement>(null)
    const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isDraggingRef = useRef(false)

    const { microphones } = useMicrophones()
    // A remembered microphone may have been unplugged since last time
    const activeMic = microphones.some((m) => m.deviceId === selectedMic)
        ? selectedMic
        : 'default'
    const cards = useMemo(() => splitCards(content, language), [content, language])
    const scriptWords = useMemo(
        () => cards.flatMap((c) => c.segments.filter((s) => s.word !== -1).map((s) => s.text)),
        [cards],
    )
    const { currentWordIndex, heard, processTranscript, reset, jumpTo } = useScriptMatcher(
        scriptWords,
        language,
    )
    const { listening: isRecognizing, error } = useSpeechRecognition({
        language,
        deviceId: activeMic,
        onTranscript: processTranscript,
        enabled: isSpeechActive && !isPaused,
    })

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

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!isNaN(val) && val >= 6 && val <= 200) setFontSize(val)
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

    // The tour points at toolbar controls, so open the toolbar and give its
    // slide-in animation time to finish before starting
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
            400,
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

    return (
        <I18nProvider language={uiLanguage}>
            <div
                className="font-sans"
                style={{
                    height: '100vh',
                    overflow: 'hidden',
                    backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
                    outline: `1px solid ${displayTextColor}`,
                    outlineOffset: '-1px',
                    boxSizing: 'border-box',
                }}>
                {titleBarVisible && (
                    <TitleBar
                        ref={titleBarRef}
                        position={titleBarPosition}
                        onPositionChange={setTitleBarPosition}
                    />
                )}

                <Toolbar
                    visible={toolbarVisible}
                    isAdjusting={isAdjusting}
                    topOffset={toolbarTopOffset}
                    isRecognizing={isRecognizing}
                    isSpeechActive={isSpeechActive}
                    isPaused={isPaused}
                    error={error}
                    content={content}
                    fontSize={fontSize}
                    bgColor={bgColor}
                    bgOpacity={bgOpacity}
                    textColor={textColor}
                    titleBarVisible={titleBarVisible}
                    hiddenFromCapture={hiddenFromCapture}
                    language={language}
                    uiLanguage={uiLanguage}
                    onUiLanguageChange={(val) => {
                        // Swap the welcome script along with the language, unless it was edited
                        if (UI_LANGUAGES.some((l) => l.messages.sampleScript === content)) {
                            setContent(getMessages(val).sampleScript)
                            reset()
                        }
                        setUiLanguage(val)
                    }}
                    langMenuOpen={langMenuOpen}
                    micMenuOpen={micMenuOpen}
                    selectedMic={activeMic}
                    microphones={microphones}
                    onPasteText={handlePasteText}
                    onImport={handleImport}
                    onClear={handleClear}
                    isEditing={isEditing}
                    onToggleEdit={handleToggleEdit}
                    onToggleListen={handleToggleListen}
                    onTogglePause={() => setIsPaused((v) => !v)}
                    onFontSizeChange={handleFontSizeChange}
                    onBgColorChange={setBgColor}
                    onBgOpacityChange={setBgOpacity}
                    onTextColorChange={setTextColor}
                    onToggleTitleBar={() => setTitleBarVisible((v) => !v)}
                    autoContrast={autoContrast}
                    onToggleAutoContrast={() => setAutoContrast((v) => !v)}
                    onShowTutorial={showTutorial}
                    targetMinutes={targetMinutes}
                    onTargetMinutesChange={setTargetMinutes}
                    readingLine={readingLine}
                    onToggleReadingLine={() => setReadingLine((v) => !v)}
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
                    isCountingDown={countdown !== null}
                    onReset={() => {
                        clearPersistentState()
                        window.location.reload()
                    }}
                    onToggleHiddenFromCapture={() => setHiddenFromCapture((v) => !v)}
                    onAdjustStart={() => handleAdjustStart()}
                    onColorPickerOpen={() => handleColorPickerOpen()}
                    onColorPickerClose={() => handleColorPickerClose()}
                    onLanguageChange={(val) => {
                        setLanguage(val)
                        setLangMenuOpen(false)
                    }}
                    onMicChange={(val) => {
                        setSelectedMic(val)
                        setMicMenuOpen(false)
                    }}
                    onLangMenuToggle={() => {
                        setLangMenuOpen((v) => !v)
                        setMicMenuOpen(false)
                    }}
                    onMicMenuToggle={() => {
                        setMicMenuOpen((v) => !v)
                        setLangMenuOpen(false)
                    }}
                />

                <button
                    data-tour="menu"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onClick={handleClick}
                    className="fixed z-50 w-9 h-9 flex items-center justify-center text-base bg-[#1a1a1a] text-white rounded-full cursor-pointer hover:bg-[#3448c5] transition-colors shadow-lg"
                    style={{
                        top:
                            (titleBarVisible && titleBarPosition === 'top'
                                ? titleBarHeight
                                : 0) + 8,
                        right: 12,
                    }}>
                    {toolbarVisible ? <X size={16} /> : <Menu size={16} />}
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
                    titleBarHeight={titleBarVisible ? titleBarHeight : 0}
                    titleBarPosition={titleBarPosition}
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
                        bottom={
                            (titleBarVisible && titleBarPosition === 'bottom'
                                ? titleBarHeight
                                : 0) + 6
                        }
                        cardCount={cards.length}
                        currentCard={currentCard}
                        onPreviousCard={() => goToCard(currentCard - 1)}
                        onNextCard={() => goToCard(currentCard + 1)}
                        sessionActive={isSpeechActive}
                        targetMinutes={targetMinutes}
                        {...pace}
                        clickThrough={clickThrough}
                    />
                )}
            </div>
        </I18nProvider>
    )
}

export default App
