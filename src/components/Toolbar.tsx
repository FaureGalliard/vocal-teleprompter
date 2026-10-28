import { useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Check,
    CircleHelp,
    ClipboardPaste,
    ExternalLink,
    FileUp,
    Mic,
    Pause,
    Pencil,
    Play,
    Square,
    Trash2,
} from 'lucide-react'
import { LANGUAGES } from '../constants/languages'
import { useT } from '../i18n'

const ICON = 14

// Width kept free on the right of the script for the toolbar, whether it is
// open or not, so opening it never reflows the text
export const TOOLBAR_RAIL_WIDTH = 52

interface ToolbarProps {
    visible: boolean
    isAdjusting: boolean
    // Distance from the top of the window to the toolbar button
    topOffset: number
    isRecognizing: boolean
    isSpeechActive: boolean
    isPaused: boolean
    isCountingDown: boolean
    content: string
    isEditing: boolean
    language: string
    langMenuOpen: boolean
    micMenuOpen: boolean
    // The system default input, the one speech recognition listens to
    defaultMicrophone: string
    micLevel: number
    onOpenSoundSettings: () => void
    onPasteText: () => void
    onImport: () => void
    onClear: () => void
    onToggleEdit: () => void
    onToggleListen: () => void
    onTogglePause: () => void
    onLanguageChange: (val: string) => void
    onLangMenuToggle: () => void
    onMicMenuToggle: () => void
    onShowTutorial: () => void
    // Panels built by App, which owns their state
    appearance: ReactNode
    settings: ReactNode
}

const iconBtn = 'flex items-center justify-center w-8 h-8 rounded-full transition-colors'
const primary = 'bg-[#445ade] text-white hover:bg-[#3448c5]'
const ghost = 'bg-white/10 text-white hover:bg-white/20'
const menu =
    'absolute right-full top-0 mr-2 z-50 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col'
const divider = <div className="w-5 h-px my-0.5 bg-white/15" />

const menuMotion = {
    initial: { opacity: 0, x: 6, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 6, scale: 0.97 },
    transition: { duration: 0.14, ease: 'easeOut' as const },
}

const speechLanguageLabel = (code: string) => LANGUAGES.find((l) => l.value === code)?.label ?? code

// Label that appears to the left of a toolbar control on hover; the control's
// wrapper needs the `group` class
export function RailTooltip({ label, hidden }: { label: string; hidden?: boolean }) {
    if (hidden) return null
    return (
        <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 px-2 py-1 rounded-md bg-[#0d0d0d] border border-white/10 text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {label}
        </span>
    )
}

function RailButton({
    label,
    onClick,
    className,
    disabled,
    children,
    tour,
}: {
    label: string
    onClick: () => void
    className: string
    disabled?: boolean
    children: ReactNode
    tour?: string
}) {
    return (
        <div
            className="relative group"
            data-tour={tour}>
            <button
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={`${iconBtn} ${className} disabled:opacity-30 disabled:cursor-not-allowed`}>
                {children}
            </button>
            <RailTooltip label={label} />
        </div>
    )
}

export default function Toolbar(props: ToolbarProps) {
    return <AnimatePresence>{props.visible && <ToolbarRail {...props} />}</AnimatePresence>
}

function ToolbarRail({
    isAdjusting,
    topOffset,
    isRecognizing,
    isSpeechActive,
    isPaused,
    isCountingDown,
    content,
    isEditing,
    language,
    langMenuOpen,
    micMenuOpen,
    defaultMicrophone,
    micLevel,
    onOpenSoundSettings,
    onPasteText,
    onImport,
    onClear,
    onToggleEdit,
    onToggleListen,
    onTogglePause,
    onLanguageChange,
    onLangMenuToggle,
    onMicMenuToggle,
    onShowTutorial,
    appearance,
    settings,
}: ToolbarProps) {
    const t = useT()
    const langMenuRef = useRef<HTMLDivElement>(null)
    const micMenuRef = useRef<HTMLDivElement>(null)
    const running = isSpeechActive || isCountingDown

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
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: isAdjusting ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            // Right under the round toolbar button
            style={{ top: topOffset + 52, width: 40, right: 10 }}
            className="fixed z-40 flex flex-col items-center gap-1 py-1.5 rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg">
            <div
                data-tour="script"
                className="flex flex-col items-center gap-1">
                <RailButton
                    label={t.toolbar.paste}
                    onClick={onPasteText}
                    className={primary}>
                    <ClipboardPaste size={ICON} />
                </RailButton>
                <RailButton
                    label={t.toolbar.import}
                    onClick={onImport}
                    className={ghost}>
                    <FileUp size={ICON} />
                </RailButton>
                <RailButton
                    label={t.toolbar.clear}
                    onClick={onClear}
                    className="bg-white/10 text-white hover:bg-red-500/80">
                    <Trash2 size={ICON} />
                </RailButton>
                <RailButton
                    label={isEditing ? t.toolbar.done : t.toolbar.edit}
                    onClick={onToggleEdit}
                    className={isEditing ? primary : ghost}>
                    {isEditing ? <Check size={ICON} /> : <Pencil size={ICON} />}
                </RailButton>
            </div>

            {divider}

            <RailButton
                tour="start"
                label={running ? t.toolbar.stop : t.toolbar.start}
                onClick={onToggleListen}
                disabled={!content}
                className={`${running ? 'bg-red-500 text-white hover:bg-red-600' : primary} ${
                    // Session on but the recognizer is (re)connecting
                    isSpeechActive && !isPaused && !isRecognizing ? 'animate-pulse' : ''
                }`}>
                {running ? <Square size={ICON} /> : <Play size={ICON} />}
            </RailButton>

            {isSpeechActive && (
                <RailButton
                    label={isPaused ? t.toolbar.resume : t.toolbar.pause}
                    onClick={onTogglePause}
                    className={isPaused ? 'bg-white text-[#1a1a1a] hover:bg-white/90' : ghost}>
                    {isPaused ? <Play size={ICON} /> : <Pause size={ICON} />}
                </RailButton>
            )}

            {divider}

            <div
                ref={langMenuRef}
                data-tour="speech-language"
                className="relative group">
                <button
                    onClick={onLangMenuToggle}
                    aria-label={t.toolbar.speechLanguage}
                    className={`${iconBtn} ${langMenuOpen ? primary : ghost} text-[10px] font-semibold`}>
                    {speechLanguageLabel(language)}
                </button>
                <RailTooltip
                    label={t.toolbar.speechLanguage}
                    hidden={langMenuOpen}
                />
                <AnimatePresence>
                    {langMenuOpen && (
                        <motion.div
                            {...menuMotion}
                            className={`${menu} min-w-[72px]`}>
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

            <div
                ref={micMenuRef}
                data-tour="microphone"
                className="relative group">
                <button
                    onClick={onMicMenuToggle}
                    aria-label={t.toolbar.microphone}
                    className={`${iconBtn} ${micMenuOpen ? primary : ghost}`}>
                    <Mic size={ICON} />
                </button>
                <RailTooltip
                    label={
                        defaultMicrophone
                            ? `${t.toolbar.microphone}: ${defaultMicrophone}`
                            : t.toolbar.microphone
                    }
                    hidden={micMenuOpen}
                />
                <AnimatePresence>
                    {micMenuOpen && (
                        <motion.div
                            {...menuMotion}
                            className={`${menu} w-64 p-3 gap-2`}>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                                {t.mic.title}
                            </span>
                            <span
                                className="text-[12px] text-white truncate"
                                title={defaultMicrophone}>
                                {defaultMicrophone || t.toolbar.noMicrophones}
                            </span>
                            <div
                                className="h-1.5 rounded-full bg-white/10 overflow-hidden"
                                title={t.mic.level}>
                                <div
                                    className="h-full rounded-full bg-[#4ade80] transition-[width] duration-75"
                                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-white/40 leading-snug">{t.mic.hint}</span>
                            <button
                                onClick={onOpenSoundSettings}
                                className="flex items-center justify-center gap-1.5 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors">
                                <ExternalLink size={12} />
                                {t.mic.change}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {divider}

            <div data-tour="look">{appearance}</div>

            <RailButton
                label={t.settings.tutorial}
                onClick={onShowTutorial}
                className={ghost}>
                <CircleHelp size={ICON} />
            </RailButton>

            {settings}
        </motion.div>
    )
}
