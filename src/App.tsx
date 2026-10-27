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
import { Menu, X } from 'lucide-react'
import { startTour } from './lib/tour'
import { segmentText } from './lib/segment'
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
    const [tourActive, setTourActive] = useState(false)
    const [tourSeen, setTourSeen] = usePersistentState('tourSeen', false)

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
    const segments = useMemo(() => segmentText(content, language), [content, language])
    const scriptWords = useMemo(
        () => segments.filter((s) => s.word !== -1).map((s) => s.text),
        [segments],
    )
    const { currentWordIndex, processTranscript, reset, jumpTo } = useScriptMatcher(
        scriptWords,
        language,
    )
    const { listening: isRecognizing, error } = useSpeechRecognition({
        language,
        deviceId: activeMic,
        onTranscript: processTranscript,
        enabled: isSpeechActive && !isPaused,
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
        setIsEditing((v) => !v)
        setIsSpeechActive(false)
        setIsPaused(false)
    }

    const handleToggleListen = () => {
        setIsEditing(false)
        setIsSpeechActive((v) => !v)
        setIsPaused(false)
        if (isSpeechActive) reset()
    }

    useEffect(() => {
        document.documentElement.lang = uiLanguage
        invoke('set_tray_labels', { ...t.tray }).catch((e) => console.error(e))
    }, [uiLanguage, t])

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
                    else setIsSpeechActive(true)
                    break
                case 'Escape':
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
                case 'PageDown':
                    jumpTo(currentWordIndex + 10)
                    break
                case 'PageUp':
                    jumpTo(currentWordIndex - 10)
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
    }, [content, isSpeechActive, isEditing, tourActive, currentWordIndex, jumpTo, setFontSize])

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
                    segments={segments}
                    currentWordIndex={currentWordIndex}
                    onWordClick={jumpTo}
                    content={content}
                    isEditing={isEditing}
                    onContentChange={setContent}
                    onEditStart={() => setIsEditing(true)}
                    onEditEnd={() => setIsEditing(false)}
                    fontSize={fontSize}
                    textColor={displayTextColor}
                    textHalo={textHalo}
                    titleBarHeight={titleBarVisible ? titleBarHeight : 0}
                    titleBarPosition={titleBarPosition}
                />
            </div>
        </I18nProvider>
    )
}

export default App
