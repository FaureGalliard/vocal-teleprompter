import { useState, useRef, useLayoutEffect, useMemo } from 'react'
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
import { segmentText } from './lib/segment'
import { usePersistentState } from './hooks/usePersistentState'

function App() {
    const [bgOpacity, setBgOpacity] = usePersistentState('bgOpacity', 0.9)
    const [bgColor, setBgColor] = usePersistentState('bgColor', '#0a0000')
    const [textColor, setTextColor] = usePersistentState('textColor', '#7698fe')
    const [titleBarPosition, setTitleBarPosition] = usePersistentState<'top' | 'bottom'>(
        'titleBarPosition',
        'top',
    )
    const [titleBarVisible, setTitleBarVisible] = usePersistentState('titleBarVisible', true)
    const [toolbarVisible, setToolbarVisible] = useState(false)
    const [titleBarHeight, setTitleBarHeight] = useState(0)
    const [content, setContent] = usePersistentState(
        'content',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    )
    const [fontSize, setFontSize] = usePersistentState('fontSize', 16)
    const [isSpeechActive, setIsSpeechActive] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isAdjusting, setIsAdjusting] = useState(false)

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
    const [language, setLanguage] = usePersistentState('language', 'es-ES')
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
                filters: [{ name: 'Texto', extensions: ['txt'] }],
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

    const handleToggleListen = () => {
        setIsSpeechActive((v) => !v)
        setIsPaused(false)
        if (isSpeechActive) reset()
    }

    const toolbarTopOffset =
        titleBarVisible && titleBarPosition === 'top' ? titleBarHeight : 0

    return (
        <div
            className="font-sans"
            style={{
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
                outline: `1px solid ${textColor}`,
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
                language={language}
                langMenuOpen={langMenuOpen}
                micMenuOpen={micMenuOpen}
                selectedMic={activeMic}
                microphones={microphones}
                onPasteText={handlePasteText}
                onImport={handleImport}
                onClear={handleClear}
                onToggleListen={handleToggleListen}
                onTogglePause={() => setIsPaused((v) => !v)}
                onFontSizeChange={handleFontSizeChange}
                onBgColorChange={setBgColor}
                onBgOpacityChange={setBgOpacity}
                onTextColorChange={setTextColor}
                onToggleTitleBar={() => setTitleBarVisible((v) => !v)}
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
                ☰
            </button>

            <Canvas
                segments={segments}
                currentWordIndex={currentWordIndex}
                onWordClick={jumpTo}
                fontSize={fontSize}
                textColor={textColor}
                titleBarHeight={titleBarVisible ? titleBarHeight : 0}
                titleBarPosition={titleBarPosition}
            />
        </div>
    )
}

export default App
