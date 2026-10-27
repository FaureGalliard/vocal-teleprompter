import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HexColorPicker } from 'react-colorful'
import { LANGUAGES } from '../constants/languages'
import type { Microphone } from '../hooks/useMicrophones'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '../i18n'
import SettingsPanel from './SettingsPanel'
import {
    Check,
    ChevronDown,
    ChevronUp,
    ClipboardPaste,
    FileUp,
    Mic,
    Languages,
    Pause,
    Pencil,
    Play,
    Square,
    Trash2,
} from 'lucide-react'

const ICON = 13

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
    hiddenFromCapture: boolean
    autoContrast: boolean
    language: string
    uiLanguage: string
    langMenuOpen: boolean
    micMenuOpen: boolean
    selectedMic: string
    microphones: Microphone[]
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    isEditing: boolean
    onToggleEdit: () => void
    onToggleListen: () => void
    onTogglePause: () => void
    onFontSizeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBgColorChange: (val: string) => void
    onBgOpacityChange: (val: number) => void
    onTextColorChange: (val: string) => void
    onToggleTitleBar: () => void
    onToggleHiddenFromCapture: () => void
    onToggleAutoContrast: () => void
    onReset: () => void
    onShowTutorial: () => void
    onLanguageChange: (val: string) => void
    onUiLanguageChange: (val: string) => void
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
    hiddenFromCapture,
    autoContrast,
    language,
    uiLanguage,
    langMenuOpen,
    micMenuOpen,
    selectedMic,
    microphones,
    onPasteText,
    onImport,
    onClear,
    isEditing,
    onToggleEdit,
    onToggleListen,
    onTogglePause,
    onFontSizeChange,
    onBgColorChange,
    onBgOpacityChange,
    onTextColorChange,
    onToggleTitleBar,
    onToggleHiddenFromCapture,
    onToggleAutoContrast,
    onReset,
    onShowTutorial,
    onLanguageChange,
    onUiLanguageChange,
    onMicChange,
    onLangMenuToggle,
    onMicMenuToggle,
    onAdjustStart,
    onColorPickerOpen,
    onColorPickerClose,
}: ToolbarProps) {
    const t = useT()
    const [colorPickerOpen, setColorPickerOpen] = useState(false)
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
    const colorPickerRef = useRef<HTMLDivElement>(null)
    const colorButtonRef = useRef<HTMLButtonElement>(null)
    const selectedMicrophone = microphones.find((m) => m.deviceId === selectedMic)
    // Chromium names its alias entries "Default - <device>"; keep just the device
    const shortMicLabel = (mic: Microphone) =>
        mic.deviceId === 'default' || mic.deviceId === 'communications'
            ? micLabel(mic).replace(/^[^-]+ - /, '')
            : micLabel(mic)
    const micLabel = (mic: Microphone) => mic.label || t.microphone(mic.deviceId.slice(0, 6))
    const langMenuRef = useRef<HTMLDivElement>(null)
    const micMenuRef = useRef<HTMLDivElement>(null)

    // Cerrar menús de idioma y micrófono al click fuera
    useEffect(() => {
        if (!langMenuOpen && !micMenuOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (langMenuOpen && !langMenuRef.current?.contains(target)) onLangMenuToggle()
            if (micMenuOpen && !micMenuRef.current?.contains(target)) onMicMenuToggle()
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [langMenuOpen, micMenuOpen, onLangMenuToggle, onMicMenuToggle])

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
                        className="fixed left-0 right-0 z-40 flex flex-wrap items-center gap-2 pl-5 pr-16 py-3 bg-[#1a1a1a] border-b border-white/10">
                        <div
                            data-tour="script"
                            className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={onPasteText}
                                className={`${btn} ${primary}`}>
                                <ClipboardPaste size={ICON} />
                                {t.toolbar.paste}
                            </button>

                            <button
                                onClick={onImport}
                                className={`${btn} ${ghost}`}>
                                <FileUp size={ICON} />
                                {t.toolbar.import}
                            </button>

                            <button
                                onClick={onClear}
                                className={`${btn} bg-white/10 text-white hover:bg-red-500/80 rounded-full`}>
                                <Trash2 size={ICON} />
                                {t.toolbar.clear}
                            </button>

                            <button
                                onClick={onToggleEdit}
                                className={`${btn} ${isEditing ? primary : ghost}`}>
                                {isEditing ? <Check size={ICON} /> : <Pencil size={ICON} />}
                                {isEditing ? t.toolbar.done : t.toolbar.edit}
                            </button>
                        </div>

                        <div className="w-px h-5 mx-1 bg-white/15" />

                        <button
                            data-tour="start"
                            onClick={onToggleListen}
                            disabled={!content}
                            className={`${btn} disabled:opacity-30 disabled:cursor-not-allowed ${
                                isSpeechActive
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : primary
                            } ${
                                // Session on but the recognizer is (re)connecting
                                isSpeechActive && !isPaused && !isRecognizing
                                    ? 'animate-pulse'
                                    : ''
                            }`}>
                            {isSpeechActive ? <Square size={ICON} /> : <Play size={ICON} />}
                            {isSpeechActive ? t.toolbar.stop : t.toolbar.start}
                        </button>

                        {isSpeechActive && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.12 }}
                                onClick={onTogglePause}
                                className={`${btn} ${isPaused ? 'bg-white text-[#1a1a1a] hover:bg-white/90' : ghost}`}>
                                {isPaused ? <Play size={ICON} /> : <Pause size={ICON} />}
                                {isPaused ? t.toolbar.resume : t.toolbar.pause}
                            </motion.button>
                        )}

                        <div className="w-px h-5 mx-1 bg-white/15" />

                        {/* Idioma */}
                        <div
                            ref={langMenuRef}
                            data-tour="speech-language"
                            className="relative">
                            <button
                                onClick={onLangMenuToggle}
                                title={t.toolbar.speechLanguage}
                                className={`${btn} ${ghost}`}>
                                <Languages size={ICON} />
                                {LANGUAGES.find((l) => l.value === language)?.label ??
                                    language}
                                {langMenuOpen ? (
                                    <ChevronUp
                                        size={12}
                                        className="opacity-50"
                                    />
                                ) : (
                                    <ChevronDown
                                        size={12}
                                        className="opacity-50"
                                    />
                                )}
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
                        <div
                            ref={micMenuRef}
                            data-tour="microphone"
                            className="relative">
                            <button
                                onClick={onMicMenuToggle}
                                title={t.toolbar.microphone}
                                className={`${btn} ${ghost}`}>
                                <Mic size={ICON} />
                                {/* Name the device in use so the button explains itself */}
                                <span className="max-w-[110px] truncate">
                                    {selectedMicrophone
                                        ? shortMicLabel(selectedMicrophone)
                                        : t.toolbar.microphone}
                                </span>
                                {micMenuOpen ? (
                                    <ChevronUp
                                        size={12}
                                        className="opacity-50"
                                    />
                                ) : (
                                    <ChevronDown
                                        size={12}
                                        className="opacity-50"
                                    />
                                )}
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
                                                title={micLabel(mic)}>
                                                {micLabel(mic)}
                                            </button>
                                        ))}
                                        {microphones.length === 0 && (
                                            <span className="px-4 py-1.5 text-[11px] text-white/30">
                                                {t.toolbar.noMicrophones}
                                            </span>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="w-px h-5 mx-1 bg-white/15" />

                        <div
                            data-tour="look"
                            className="flex flex-wrap items-center gap-2">
                            {/* Tamaño */}
                            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                                <span className="text-[9px] text-white/50 uppercase">
                                    {t.toolbar.size}
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
                                    {t.toolbar.background}
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
                                    {t.toolbar.text}
                                </span>
                                <button
                                    ref={colorButtonRef}
                                    onClick={handleOpenColorPicker}
                                    className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                                    style={{ backgroundColor: textColor }}
                                />
                            </div>
                        </div>

                        <div className="w-px h-5 mx-1 bg-white/15" />

                        <SettingsPanel
                            uiLanguage={uiLanguage}
                            hiddenFromCapture={hiddenFromCapture}
                            autoContrast={autoContrast}
                            titleBarVisible={titleBarVisible}
                            onUiLanguageChange={onUiLanguageChange}
                            onToggleHiddenFromCapture={onToggleHiddenFromCapture}
                            onToggleAutoContrast={onToggleAutoContrast}
                            onToggleTitleBar={onToggleTitleBar}
                            onReset={onReset}
                            onShowTutorial={onShowTutorial}
                        />

                        {error && (
                            <span className="text-[10px] text-red-400 ml-1">
                                {t.errors[error] ?? error}
                            </span>
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
                                    {t.toolbar.ok}
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
