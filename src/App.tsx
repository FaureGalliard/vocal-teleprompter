import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useScriptMatcher } from './hooks/useScriptMatcher'
import { useMicrophones } from './hooks/useMicrophones'

const LANGUAGES = [
    { label: 'ES', value: 'es-ES' },
    { label: 'EN', value: 'en-US' },
    { label: 'FR', value: 'fr-FR' },
    { label: 'DE', value: 'de-DE' },
    { label: 'IT', value: 'it-IT' },
    { label: 'PT', value: 'pt-BR' },
    { label: 'JA', value: 'ja-JP' },
    { label: 'ZH', value: 'zh-CN' },
    { label: 'KO', value: 'ko-KR' },
]

function App() {
    const [bgOpacity, setBgOpacity] = useState(1)
    const [bgColor, setBgColor] = useState('#ffffff')
    const [textColor, setTextColor] = useState('#1a1a1a')
    const [titleBarPosition, setTitleBarPosition] = useState<'top' | 'bottom'>('top')
    const [titleBarVisible, setTitleBarVisible] = useState(true)
    const [toolbarVisible, setToolbarVisible] = useState(false)
    const [titleBarHeight, setTitleBarHeight] = useState(0)
    const [content, setContent] = useState('')
    const [fontSize, setFontSize] = useState(24)
    const [isListening, setIsListening] = useState(false)
    const [language, setLanguage] = useState('es-ES')
    const [langMenuOpen, setLangMenuOpen] = useState(false)
    const [micMenuOpen, setMicMenuOpen] = useState(false)
    const [selectedMic, setSelectedMic] = useState('default')
    const titleBarRef = useRef<HTMLDivElement>(null)
    const activeWordRef = useRef<HTMLSpanElement>(null)

    const { microphones } = useMicrophones()
    const scriptWords = content.split(/\s+/).filter(Boolean)
    const { currentWordIndex, processTranscript, reset } = useScriptMatcher(scriptWords)
    const { listening, error } = useSpeechRecognition({
        language,
        deviceId: selectedMic,
        onTranscript: processTranscript,
        enabled: isListening,
    })

    useLayoutEffect(() => {
        if (titleBarRef.current) {
            setTitleBarHeight(titleBarRef.current.offsetHeight)
        }
    }, [titleBarVisible, titleBarPosition])

    useEffect(() => {
        if (activeWordRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [currentWordIndex])

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
    }

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!isNaN(val) && val >= 6 && val <= 200) setFontSize(val)
    }

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

            {/* Toolbar fixed */}
            {toolbarVisible && (
                <div
                    className="fixed left-0 right-0 z-40 flex flex-wrap items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-white/10"
                    style={{
                        top:
                            titleBarVisible && titleBarPosition === 'top'
                                ? titleBarHeight
                                : 0,
                    }}>
                    <button
                        onClick={handlePasteText}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors">
                        + PEGAR TEXTO
                    </button>

                    <button
                        onClick={handleImport}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] transition-colors">
                        ↑ IMPORTAR
                    </button>

                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-red-600 hover:border-red-600 transition-colors">
                        ✕ ELIMINAR
                    </button>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    {/* Start / Stop */}
                    <button
                        onClick={() => {
                            setIsListening((v) => !v)
                            if (isListening) reset()
                        }}
                        disabled={!content}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            listening
                                ? 'border-red-400 bg-red-500 text-white hover:bg-red-600'
                                : 'border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a]'
                        }`}>
                        {listening ? '⏹ DETENER' : '🎙 INICIAR'}
                    </button>

                    {/* Selector de idioma */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setLangMenuOpen((v) => !v)
                                setMicMenuOpen(false)
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] transition-colors">
                            {LANGUAGES.find((l) => l.value === language)?.label ?? 'ES'}
                            <span className="text-[9px] opacity-60">
                                {langMenuOpen ? '▲' : '▼'}
                            </span>
                        </button>

                        {langMenuOpen && (
                            <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/20 flex flex-col min-w-[48px]">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.value}
                                        onClick={() => {
                                            setLanguage(lang.value)
                                            setLangMenuOpen(false)
                                        }}
                                        className={`px-3 py-1 text-[11px] font-medium text-left transition-colors ${
                                            language === lang.value
                                                ? 'bg-white text-[#1a1a1a]'
                                                : 'text-white hover:bg-white/10'
                                        }`}>
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selector de micrófono */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setMicMenuOpen((v) => !v)
                                setLangMenuOpen(false)
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] transition-colors">
                            🎙
                            <span className="text-[9px] opacity-60">
                                {micMenuOpen ? '▲' : '▼'}
                            </span>
                        </button>

                        {micMenuOpen && (
                            <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/20 flex flex-col min-w-[180px] max-w-[260px]">
                                {microphones.map((mic) => (
                                    <button
                                        key={mic.deviceId}
                                        onClick={() => {
                                            setSelectedMic(mic.deviceId)
                                            setMicMenuOpen(false)
                                        }}
                                        className={`px-3 py-1.5 text-[11px] font-medium text-left transition-colors truncate ${
                                            selectedMic === mic.deviceId
                                                ? 'bg-white text-[#1a1a1a]'
                                                : 'text-white hover:bg-white/10'
                                        }`}
                                        title={mic.label}>
                                        {mic.label}
                                    </button>
                                ))}
                                {microphones.length === 0 && (
                                    <span className="px-3 py-1.5 text-[11px] text-white/40">
                                        Sin micrófonos
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/60">TAMAÑO</span>
                        <input
                            type="number"
                            min={6}
                            max={200}
                            value={fontSize}
                            onChange={handleFontSizeChange}
                            className="w-12 px-1 py-0.5 text-[11px] text-white bg-transparent border border-white/40 text-center focus:outline-none focus:border-white"
                        />
                        <span className="text-[9px] text-white/40">px</span>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/60">FONDO</span>
                        <div className="relative w-5 h-5 border border-white/40">
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: bgColor }}
                            />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={bgOpacity}
                            onChange={(e) => setBgOpacity(Number(e.target.value))}
                            className="w-16 accent-white"
                        />
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/60">TEXTO</span>
                        <div className="relative w-5 h-5 border border-white/40">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: textColor }}
                            />
                        </div>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <button
                        onClick={() => setTitleBarVisible((v) => !v)}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white transition-colors ${
                            titleBarVisible
                                ? 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
                                : 'bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a]'
                        }`}>
                        {titleBarVisible ? '▲ OCULTAR BARRA' : '▼ MOSTRAR BARRA'}
                    </button>

                    {error && <span className="text-[10px] text-red-400">{error}</span>}
                </div>
            )}

            {/* Botón ☰ fixed */}
            <button
                onClick={() => setToolbarVisible((v) => !v)}
                className="fixed z-50 w-8 h-8 flex items-center justify-center text-base bg-[#1a1a1a] text-white cursor-pointer hover:opacity-70 transition-opacity"
                style={{
                    top:
                        (titleBarVisible && titleBarPosition === 'top'
                            ? titleBarHeight
                            : 0) + 8,
                    right: 12,
                }}>
                ☰
            </button>

            {/* Canvas */}
            <div
                className="overflow-y-auto"
                style={{
                    height: '100vh',
                    paddingTop: canvasPaddingTop,
                    paddingBottom: canvasPaddingBottom,
                    boxSizing: 'border-box',
                }}>
                <div className="min-h-full flex items-start justify-center p-12">
                    {content ? (
                        <p
                            className="text-center leading-relaxed w-full"
                            style={{ fontSize: `${fontSize}px` }}>
                            {scriptWords.map((word, i) => {
                                const isCurrentWord = i === currentWordIndex
                                const isPast = i < currentWordIndex
                                const isNearby =
                                    i > currentWordIndex && i <= currentWordIndex + 8

                                return (
                                    <span
                                        key={i}
                                        ref={isCurrentWord ? activeWordRef : null}
                                        style={{
                                            color: isCurrentWord
                                                ? '#1a1a1a'
                                                : isPast
                                                  ? `${textColor}50`
                                                  : textColor,
                                            backgroundColor: isCurrentWord
                                                ? '#facc15'
                                                : isNearby
                                                  ? `${textColor}10`
                                                  : 'transparent',
                                            borderRadius: isCurrentWord
                                                ? '2px'
                                                : undefined,
                                            padding: isCurrentWord ? '0 2px' : undefined,
                                            transition:
                                                'color 0.2s ease, background-color 0.2s ease',
                                        }}>
                                        {word}{' '}
                                    </span>
                                )
                            })}
                        </p>
                    ) : (
                        <p
                            className="text-5xl text-center opacity-15"
                            style={{ color: textColor }}>
                            Tu texto aparecerá aquí
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App
