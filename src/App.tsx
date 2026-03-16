import { useState, useRef, useLayoutEffect } from 'react'
import TitleBar from './components/TitleBar'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useScriptMatcher } from './hooks/useScriptMatcher'
import { useMicrophones } from './hooks/useMicrophones'

function App() {
    const [bgOpacity, setBgOpacity] = useState(0.9)
    const [bgColor, setBgColor] = useState('#0a0000')
    const [textColor, setTextColor] = useState('#7698fe')
    const [titleBarPosition, setTitleBarPosition] = useState<'top' | 'bottom'>('top')
    const [titleBarVisible, setTitleBarVisible] = useState(true)
    const [toolbarVisible, setToolbarVisible] = useState(false)
    const [titleBarHeight, setTitleBarHeight] = useState(0)
    const [content, setContent] = useState(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    )
    const [fontSize, setFontSize] = useState(16)
    const [isListening, setIsListening] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [language, setLanguage] = useState('es-ES')
    const [langMenuOpen, setLangMenuOpen] = useState(false)
    const [micMenuOpen, setMicMenuOpen] = useState(false)
    const [selectedMic, setSelectedMic] = useState('default')
    const titleBarRef = useRef<HTMLDivElement>(null)

    const { microphones } = useMicrophones()
    const scriptWords = content.split(/\s+/).filter(Boolean)
    const { currentWordIndex, processTranscript, reset } = useScriptMatcher(scriptWords)
    const { listening, error } = useSpeechRecognition({
        language,
        deviceId: selectedMic,
        onTranscript: processTranscript,
        enabled: isListening && !isPaused,
    })

    useLayoutEffect(() => {
        if (titleBarRef.current) {
            setTitleBarHeight(titleBarRef.current.offsetHeight)
        }
    }, [titleBarVisible, titleBarPosition])

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
        setIsListening(false)
        setIsPaused(false)
    }

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!isNaN(val) && val >= 6 && val <= 200) setFontSize(val)
    }

    const handleToggleListen = () => {
        setIsListening((v) => !v)
        setIsPaused(false)
        if (isListening) reset()
    }

    const toolbarTopOffset =
        titleBarVisible && titleBarPosition === 'top' ? titleBarHeight : 0
    const canvasPaddingTop =
        titleBarVisible && titleBarPosition === 'top' ? titleBarHeight : 0
    const canvasPaddingBottom =
        titleBarVisible && titleBarPosition === 'bottom' ? titleBarHeight : 0

    return (
        <div
            className="font-sans"
            style={{
                height: '100vh',
                backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
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
                topOffset={toolbarTopOffset}
                listening={listening}
                isListening={isListening}
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
                selectedMic={selectedMic}
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
                onClick={() => setToolbarVisible((v) => !v)}
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
                scriptWords={scriptWords}
                currentWordIndex={currentWordIndex}
                fontSize={fontSize}
                textColor={textColor}
                paddingTop={canvasPaddingTop}
                paddingBottom={canvasPaddingBottom}
            />
        </div>
    )
}

export default App
