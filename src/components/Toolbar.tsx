import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HexColorPicker } from 'react-colorful'
import { LANGUAGES } from '../constants/languages'
import type { Microphone } from '../hooks/useMicrophones'
import { motion, AnimatePresence } from 'framer-motion'

interface ToolbarProps {
    visible: boolean
    isAdjusting: boolean
    topOffset: number
    isRecognizing: boolean
    isSpeechActive: boolean
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
    onAdjustStart: () => void
    onColorPickerOpen: () => void
    onColorPickerClose: () => void
}

const btn = `flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full transition-all duration-150`
const primary = `bg-[#445ade] text-white hover:bg-[#3448c5]`
const ghost = `bg-white/10 text-white hover:bg-white/20`

export default function Toolbar({
    visible,
    isAdjusting,
    topOffset,
    isRecognizing,
    isSpeechActive,
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
    onAdjustStart,
    onColorPickerOpen,
    onColorPickerClose,
}: ToolbarProps) {
    const [colorPickerOpen, setColorPickerOpen] = useState(false)
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
    const colorPickerRef = useRef<HTMLDivElement>(null)
    const colorButtonRef = useRef<HTMLButtonElement>(null)

    // Cerrar picker al click fuera
    useEffect(() => {
        if (!colorPickerOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (
                colorPickerRef.current &&
                !colorPickerRef.current.contains(e.target as Node) &&
                colorButtonRef.current &&
                !colorButtonRef.current.contains(e.target as Node)
            ) {
                setColorPickerOpen(false)
                onColorPickerClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [colorPickerOpen, onColorPickerClose])

    // Ocultar toolbar solo cuando el usuario arrastra saturation o hue
    useEffect(() => {
        if (!colorPickerOpen || !colorPickerRef.current) return
        const saturation = colorPickerRef.current.querySelector(
            '.react-colorful__saturation',
        )
        const hue = colorPickerRef.current.querySelector('.react-colorful__hue')

        const makeHandler = () => {
            onColorPickerOpen()
            const onUp = () => {
                onColorPickerClose()
                window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mouseup', onUp)
        }

        saturation?.addEventListener('mousedown', makeHandler)
        hue?.addEventListener('mousedown', makeHandler)
        return () => {
            saturation?.removeEventListener('mousedown', makeHandler)
            hue?.removeEventListener('mousedown', makeHandler)
        }
    }, [colorPickerOpen, onColorPickerOpen, onColorPickerClose])

    const handleOpenColorPicker = () => {
        if (colorPickerOpen) {
            setColorPickerOpen(false)
            onColorPickerClose()
            return
        }
        if (colorButtonRef.current) {
            const rect = colorButtonRef.current.getBoundingClientRect()
            const pickerH = 220
            const pickerW = 200
            const spaceBelow = window.innerHeight - rect.bottom
            const top = spaceBelow >= pickerH ? rect.bottom + 8 : rect.top - pickerH - 8
            const left = Math.min(rect.left, window.innerWidth - pickerW - 8)
            setPickerPos({ top, left })
        }
        setColorPickerOpen(true)
    }

    const handleCloseColorPicker = () => {
        setColorPickerOpen(false)
        onColorPickerClose()
    }

    return (
        <>
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%', scaleX: 0.8 }}
                        animate={{ opacity: isAdjusting ? 0 : 1, x: 0, scaleX: 1 }}
                        exit={{ opacity: 0, x: '100%', scaleX: 0.8 }}
                        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                        style={{
                            top: topOffset,
                            transformOrigin: 'right center',
                        }}
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
                                isRecognizing
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : primary
                            }`}>
                            {isRecognizing ? '⏹ DETENER' : '🎙 INICIAR'}
                        </button>

                        {isSpeechActive && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.12 }}
                                onClick={onTogglePause}
                                className={`${btn} ${isPaused ? 'bg-white text-[#1a1a1a] hover:bg-white/90' : ghost}`}>
                                {isPaused ? '▶ REANUDAR' : '⏸ PAUSAR'}
                            </motion.button>
                        )}

                        <div className="w-px h-5 mx-1 bg-white/15" />

                        {/* Idioma */}
                        <div className="relative">
                            <button
                                onClick={onLangMenuToggle}
                                className={`${btn} ${ghost}`}>
                                {LANGUAGES.find((l) => l.value === language)?.label ??
                                    'ES'}
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
                                                onClick={() =>
                                                    onLanguageChange(lang.value)
                                                }
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
                            <span className="text-[9px] text-white/50 uppercase">
                                Tamaño
                            </span>
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
                            <span className="text-[9px] text-white/50 uppercase">
                                Fondo
                            </span>
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
                                onMouseDown={() => {
                                    if (colorPickerOpen) {
                                        setColorPickerOpen(false)
                                        onColorPickerClose()
                                    }
                                    onAdjustStart()
                                }}
                                onTouchStart={() => {
                                    if (colorPickerOpen) {
                                        setColorPickerOpen(false)
                                        onColorPickerClose()
                                    }
                                    onAdjustStart()
                                }}
                                onChange={(e) =>
                                    onBgOpacityChange(Number(e.target.value))
                                }
                                className="w-14 accent-[#445ade]"
                            />
                        </div>

                        <div className="w-px h-5 mx-1 bg-white/15" />

                        {/* Texto */}
                        <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                            <span className="text-[9px] text-white/50 uppercase">
                                Texto
                            </span>
                            <button
                                ref={colorButtonRef}
                                onClick={handleOpenColorPicker}
                                className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                                style={{ backgroundColor: textColor }}
                            />
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

            {/* Picker via portal — fuera del toolbar, no afectado por su opacidad */}
            {createPortal(
                <AnimatePresence>
                    {colorPickerOpen && (
                        <motion.div
                            ref={colorPickerRef}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                top: pickerPos.top,
                                left: pickerPos.left,
                                zIndex: 9999,
                            }}
                            className="bg-[#242424] border border-white/10 rounded-xl p-3 shadow-xl">
                            <HexColorPicker
                                color={textColor}
                                onChange={onTextColorChange}
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-white/40 font-mono flex-1">
                                    {textColor}
                                </span>
                                <button
                                    onClick={handleCloseColorPicker}
                                    className="text-[10px] text-white/60 hover:text-white px-2 py-0.5 bg-white/10 rounded-full transition-colors">
                                    OK
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    )
}
