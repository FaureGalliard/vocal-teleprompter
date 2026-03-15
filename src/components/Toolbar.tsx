import { useRef } from 'react'
import { LANGUAGES } from '../constants/languages'
import type { Microphone } from '../hooks/useMicrophones'

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
    if (!visible) return null

    return (
        <div
            className="fixed left-0 right-0 z-40 flex flex-wrap items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-white/10"
            style={{ top: topOffset }}>
            <button
                onClick={onPasteText}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors">
                + PEGAR TEXTO
            </button>

            <button
                onClick={onImport}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] transition-colors">
                ↑ IMPORTAR
            </button>

            <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-red-600 hover:border-red-600 transition-colors">
                ✕ ELIMINAR
            </button>

            <div className="w-px h-5 mx-1 bg-white/20" />

            <button
                onClick={onToggleListen}
                disabled={!content}
                className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    listening
                        ? 'border-red-400 bg-red-500 text-white hover:bg-red-600'
                        : 'border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a]'
                }`}>
                {listening ? '⏹ DETENER' : '🎙 INICIAR'}
            </button>

            {isListening && (
                <button
                    onClick={onTogglePause}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border transition-colors ${
                        isPaused
                            ? 'border-white bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
                            : 'border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a]'
                    }`}>
                    {isPaused ? '▶ REANUDAR' : '⏸ PAUSAR'}
                </button>
            )}

            {/* Selector de idioma */}
            <div className="relative">
                <button
                    onClick={onLangMenuToggle}
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
                                onClick={() => onLanguageChange(lang.value)}
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
                    onClick={onMicMenuToggle}
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
                                onClick={() => onMicChange(mic.deviceId)}
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
                    onChange={onFontSizeChange}
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
                        onChange={(e) => onBgColorChange(e.target.value)}
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
                    onChange={(e) => onBgOpacityChange(Number(e.target.value))}
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
                        onChange={(e) => onTextColorChange(e.target.value)}
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
                onClick={onToggleTitleBar}
                className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white transition-colors ${
                    titleBarVisible
                        ? 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
                        : 'bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a]'
                }`}>
                {titleBarVisible ? '▲ OCULTAR BARRA' : '▼ MOSTRAR BARRA'}
            </button>

            {error && <span className="text-[10px] text-red-400">{error}</span>}
        </div>
    )
}
