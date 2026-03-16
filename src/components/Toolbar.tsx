import { LANGUAGES } from '../constants/languages'
import type { Microphone } from '../hooks/useMicrophones'
import { motion, AnimatePresence } from 'framer-motion'

interface ToolbarProps {
    visible: boolean
    topOffset: number
    listening: boolean
    isListening: boolean
    isPaused: boolean
    error: string | null
    content: string
    fontSize: number
    bgColor: string
    bgOpacity: number
    textColor: string
    titleBarVisible: boolean
    language: string
    langMenuOpen: boolean
    micMenuOpen: boolean
    selectedMic: string
    microphones: Microphone[]
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    onToggleListen: () => void
    onTogglePause: () => void
    onFontSizeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBgColorChange: (val: string) => void
    onBgOpacityChange: (val: number) => void
    onTextColorChange: (val: string) => void
    onToggleTitleBar: () => void
    onLanguageChange: (val: string) => void
    onMicChange: (val: string) => void
    onLangMenuToggle: () => void
    onMicMenuToggle: () => void
}

const btn = `flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full transition-all duration-150`
const primary = `bg-[#445ade] text-white hover:bg-[#3448c5]`
const ghost = `bg-white/10 text-white hover:bg-white/20`

export default function Toolbar({
    visible,
    topOffset,
    listening,
    isListening,
    isPaused,
    error,
    content,
    fontSize,
    bgColor,
    bgOpacity,
    textColor,
    titleBarVisible,
    language,
    langMenuOpen,
    micMenuOpen,
    selectedMic,
    microphones,
    onPasteText,
    onImport,
    onClear,
    onToggleListen,
    onTogglePause,
    onFontSizeChange,
    onBgColorChange,
    onBgOpacityChange,
    onTextColorChange,
    onToggleTitleBar,
    onLanguageChange,
    onMicChange,
    onLangMenuToggle,
    onMicMenuToggle,
}: ToolbarProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: '100%', scaleX: 0.8 }}
                    animate={{ opacity: 1, x: 0, scaleX: 1 }}
                    exit={{ opacity: 0, x: '100%', scaleX: 0.8 }}
                    transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                    style={{ top: topOffset, transformOrigin: 'right center' }}
                    className="fixed left-0 right-0 z-40 flex flex-wrap items-center gap-2 px-5 py-3 bg-[#1a1a1a] border-b border-white/10">
                    <button
                        onClick={onPasteText}
                        className={`${btn} ${primary}`}>
                        + PEGAR
                    </button>

                    <button
                        onClick={onImport}
                        className={`${btn} ${ghost}`}>
                        ↑ IMPORTAR
                    </button>

                    <button
                        onClick={onClear}
                        className={`${btn} bg-white/10 text-white hover:bg-red-500/80 rounded-full`}>
                        ✕ ELIMINAR
                    </button>

                    <div className="w-px h-5 mx-1 bg-white/15" />

                    <button
                        onClick={onToggleListen}
                        disabled={!content}
                        className={`${btn} disabled:opacity-30 disabled:cursor-not-allowed ${
                            listening ? 'bg-red-500 text-white hover:bg-red-600' : primary
                        }`}>
                        {listening ? '⏹ DETENER' : '🎙 INICIAR'}
                    </button>

                    {isListening && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.12 }}
                            onClick={onTogglePause}
                            className={`${btn} ${
                                isPaused
                                    ? 'bg-white text-[#1a1a1a] hover:bg-white/90'
                                    : ghost
                            }`}>
                            {isPaused ? '▶ REANUDAR' : '⏸ PAUSAR'}
                        </motion.button>
                    )}

                    <div className="w-px h-5 mx-1 bg-white/15" />

                    {/* Idioma */}
                    <div className="relative">
                        <button
                            onClick={onLangMenuToggle}
                            className={`${btn} ${ghost}`}>
                            {LANGUAGES.find((l) => l.value === language)?.label ?? 'ES'}
                            <span className="text-[9px] opacity-50">
                                {langMenuOpen ? '▲' : '▼'}
                            </span>
                        </button>

                        <AnimatePresence>
                            {langMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.14, ease: 'easeOut' }}
                                    className="absolute top-full left-0 mt-2 z-50 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col min-w-[64px]">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.value}
                                            onClick={() => onLanguageChange(lang.value)}
                                            className={`px-4 py-1.5 text-[11px] font-medium text-left transition-colors ${
                                                language === lang.value
                                                    ? 'bg-[#445ade] text-white'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}>
                                            {lang.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Micrófono */}
                    <div className="relative">
                        <button
                            onClick={onMicMenuToggle}
                            className={`${btn} ${ghost}`}>
                            🎙
                            <span className="text-[9px] opacity-50">
                                {micMenuOpen ? '▲' : '▼'}
                            </span>
                        </button>

                        <AnimatePresence>
                            {micMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.14, ease: 'easeOut' }}
                                    className="absolute top-full left-0 mt-2 z-50 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col min-w-[180px] max-w-[260px]">
                                    {microphones.map((mic) => (
                                        <button
                                            key={mic.deviceId}
                                            onClick={() => onMicChange(mic.deviceId)}
                                            className={`px-4 py-1.5 text-[11px] font-medium text-left transition-colors truncate ${
                                                selectedMic === mic.deviceId
                                                    ? 'bg-[#445ade] text-white'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                            title={mic.label}>
                                            {mic.label}
                                        </button>
                                    ))}
                                    {microphones.length === 0 && (
                                        <span className="px-4 py-1.5 text-[11px] text-white/30">
                                            Sin micrófonos
                                        </span>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/15" />

                    {/* Tamaño */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                        <span className="text-[9px] text-white/50 uppercase">Tamaño</span>
                        <input
                            type="number"
                            min={6}
                            max={200}
                            value={fontSize}
                            onChange={onFontSizeChange}
                            className="w-10 text-[11px] text-white bg-transparent text-center focus:outline-none"
                        />
                        <span className="text-[9px] text-white/30">px</span>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/15" />

                    {/* Fondo */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                        <span className="text-[9px] text-white/50 uppercase">Fondo</span>
                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/20">
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => onBgColorChange(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full rounded-full"
                                style={{ backgroundColor: bgColor }}
                            />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={bgOpacity}
                            onChange={(e) => onBgOpacityChange(Number(e.target.value))}
                            className="w-14 accent-[#445ade]"
                        />
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/15" />

                    {/* Texto */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                        <span className="text-[9px] text-white/50 uppercase">Texto</span>
                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/20">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => onTextColorChange(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full rounded-full"
                                style={{ backgroundColor: textColor }}
                            />
                        </div>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/15" />

                    <button
                        onClick={onToggleTitleBar}
                        className={`${btn} ${ghost}`}>
                        {titleBarVisible ? '▲ BARRA' : '▼ BARRA'}
                    </button>

                    {error && (
                        <span className="text-[10px] text-red-400 ml-1">{error}</span>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
