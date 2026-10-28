import { useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Check,
    ChevronDown,
    CircleHelp,
    ClipboardPaste,
    FileUp,
    Languages,
    Mic,
    Pause,
    Pencil,
    Play,
    Square,
    Trash2,
} from 'lucide-react'
import { LANGUAGES } from '../constants/languages'
import type { Microphone } from '../hooks/useMicrophones'
import { useT } from '../i18n'

const ICON = 13

interface ToolbarProps {
    visible: boolean
    isAdjusting: boolean
    topOffset: number
    // Reports the bar's height so the script can move down instead of hiding under it
    onHeightChange: (height: number) => void
    isRecognizing: boolean
    isSpeechActive: boolean
    isPaused: boolean
    isCountingDown: boolean
    error: string | null
    content: string
    isEditing: boolean
    language: string
    langMenuOpen: boolean
    micMenuOpen: boolean
    selectedMic: string
    microphones: Microphone[]
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    onToggleEdit: () => void
    onToggleListen: () => void
    onTogglePause: () => void
    onLanguageChange: (val: string) => void
    onMicChange: (val: string) => void
    onLangMenuToggle: () => void
    onMicMenuToggle: () => void
    onShowTutorial: () => void
    // Panels built by App, which owns their state
    appearance: ReactNode
    settings: ReactNode
}

const btn = 'flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-full transition-colors'
const iconBtn = 'flex items-center justify-center w-7 h-7 rounded-full transition-colors'
const primary = 'bg-[#445ade] text-white hover:bg-[#3448c5]'
const ghost = 'bg-white/10 text-white hover:bg-white/20'
const menu =
    'absolute top-full left-0 mt-2 z-50 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col'
const menuItem = (active: boolean) =>
    `px-4 py-1.5 text-[11px] font-medium text-left transition-colors truncate ${
        active ? 'bg-[#445ade] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`
const divider = <div className="w-px h-5 mx-0.5 bg-white/15" />

const menuMotion = {
    initial: { opacity: 0, y: -6, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6, scale: 0.97 },
    transition: { duration: 0.14, ease: 'easeOut' as const },
}

export default function Toolbar(props: ToolbarProps) {
    return (
        <AnimatePresence>
            {props.visible && <ToolbarBar {...props} />}
        </AnimatePresence>
    )
}

function ToolbarBar({
    isAdjusting,
    topOffset,
    onHeightChange,
    isRecognizing,
    isSpeechActive,
    isPaused,
    isCountingDown,
    error,
    content,
    isEditing,
    language,
    langMenuOpen,
    micMenuOpen,
    selectedMic,
    microphones,
    onPasteText,
    onImport,
    onClear,
    onToggleEdit,
    onToggleListen,
    onTogglePause,
    onLanguageChange,
    onMicChange,
    onLangMenuToggle,
    onMicMenuToggle,
    onShowTutorial,
    appearance,
    settings,
}: ToolbarProps) {
    const t = useT()
    const barRef = useRef<HTMLDivElement>(null)
    const langMenuRef = useRef<HTMLDivElement>(null)
    const micMenuRef = useRef<HTMLDivElement>(null)
    const running = isSpeechActive || isCountingDown

    const micLabel = (mic: Microphone) => mic.label || t.microphone(mic.deviceId.slice(0, 6))
    // Chromium names its alias entries "Default - <device>"; keep just the device
    const shortMicLabel = (mic: Microphone) =>
        mic.deviceId === 'default' || mic.deviceId === 'communications'
            ? micLabel(mic).replace(/^[^-]+ - /, '')
            : micLabel(mic)
    const selectedMicrophone = microphones.find((m) => m.deviceId === selectedMic)

    useEffect(() => {
        const bar = barRef.current
        if (!bar) return
        const observer = new ResizeObserver(() => onHeightChange(bar.offsetHeight))
        observer.observe(bar)
        return () => {
            observer.disconnect()
            onHeightChange(0)
        }
        // onHeightChange is a state setter
    }, [])

    // Close the language and microphone menus on outside click
    useEffect(() => {
        if (!langMenuOpen && !micMenuOpen) return
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (langMenuOpen && !langMenuRef.current?.contains(target)) onLangMenuToggle()
            if (micMenuOpen && !micMenuRef.current?.contains(target)) onMicMenuToggle()
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [langMenuOpen, micMenuOpen, onLangMenuToggle, onMicMenuToggle])

    return (
        <motion.div
            ref={barRef}
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: isAdjusting ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{ top: topOffset }}
            // Room on the right for the floating toolbar button
            className="fixed left-0 right-0 z-40 flex flex-wrap items-center gap-1.5 pl-4 pr-14 py-2 bg-[#1a1a1a] border-b border-white/10">
            <div
                data-tour="script"
                className="flex items-center gap-1.5">
                <button
                    onClick={onPasteText}
                    title={t.toolbar.paste}
                    className={`${iconBtn} ${primary}`}>
                    <ClipboardPaste size={ICON} />
                </button>
                <button
                    onClick={onImport}
                    title={t.toolbar.import}
                    className={`${iconBtn} ${ghost}`}>
                    <FileUp size={ICON} />
                </button>
                <button
                    onClick={onClear}
                    title={t.toolbar.clear}
                    className={`${iconBtn} bg-white/10 text-white hover:bg-red-500/80`}>
                    <Trash2 size={ICON} />
                </button>
                <button
                    onClick={onToggleEdit}
                    title={isEditing ? t.toolbar.done : t.toolbar.edit}
                    className={`${iconBtn} ${isEditing ? primary : ghost}`}>
                    {isEditing ? <Check size={ICON} /> : <Pencil size={ICON} />}
                </button>
            </div>

            {divider}

            <button
                data-tour="start"
                onClick={onToggleListen}
                disabled={!content}
                className={`${btn} disabled:opacity-30 disabled:cursor-not-allowed ${
                    running ? 'bg-red-500 text-white hover:bg-red-600' : primary
                } ${
                    // Session on but the recognizer is (re)connecting
                    isSpeechActive && !isPaused && !isRecognizing ? 'animate-pulse' : ''
                }`}>
                {running ? <Square size={ICON} /> : <Play size={ICON} />}
                {running ? t.toolbar.stop : t.toolbar.start}
            </button>

            {isSpeechActive && (
                <button
                    onClick={onTogglePause}
                    title={isPaused ? t.toolbar.resume : t.toolbar.pause}
                    className={`${iconBtn} ${isPaused ? 'bg-white text-[#1a1a1a] hover:bg-white/90' : ghost}`}>
                    {isPaused ? <Play size={ICON} /> : <Pause size={ICON} />}
                </button>
            )}

            {divider}

            <div
                ref={langMenuRef}
                data-tour="speech-language"
                className="relative">
                <button
                    onClick={onLangMenuToggle}
                    title={t.toolbar.speechLanguage}
                    className={`${btn} ${ghost} px-2.5`}>
                    <Languages size={ICON} />
                    {LANGUAGES.find((l) => l.value === language)?.label ?? language}
                    <ChevronDown
                        size={12}
                        className={`opacity-50 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                <AnimatePresence>
                    {langMenuOpen && (
                        <motion.div
                            {...menuMotion}
                            className={`${menu} min-w-[64px]`}>
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.value}
                                    onClick={() => onLanguageChange(lang.value)}
                                    className={menuItem(language === lang.value)}>
                                    {lang.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div
                ref={micMenuRef}
                data-tour="microphone"
                className="relative">
                <button
                    onClick={onMicMenuToggle}
                    title={t.toolbar.microphone}
                    className={`${btn} ${ghost} px-2.5`}>
                    <Mic size={ICON} />
                    {/* Name the device in use so the button explains itself */}
                    <span className="max-w-[90px] truncate">
                        {selectedMicrophone ? shortMicLabel(selectedMicrophone) : t.toolbar.microphone}
                    </span>
                    <ChevronDown
                        size={12}
                        className={`opacity-50 transition-transform ${micMenuOpen ? 'rotate-180' : ''}`}
                    />
                </button>
                <AnimatePresence>
                    {micMenuOpen && (
                        <motion.div
                            {...menuMotion}
                            className={`${menu} min-w-[180px] max-w-[260px]`}>
                            {microphones.map((mic) => (
                                <button
                                    key={mic.deviceId}
                                    onClick={() => onMicChange(mic.deviceId)}
                                    className={menuItem(selectedMic === mic.deviceId)}
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

            {divider}

            <div data-tour="look">{appearance}</div>

            <button
                onClick={onShowTutorial}
                title={t.settings.tutorial}
                className={`${iconBtn} ${ghost}`}>
                <CircleHelp size={14} />
            </button>

            {settings}

            {error && (
                <span className="text-[10px] text-red-400 ml-1">{t.errors[error] ?? error}</span>
            )}
        </motion.div>
    )
}
