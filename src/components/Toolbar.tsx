import { useRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Check,
    CircleHelp,
    ClipboardPaste,
    Check as Selected,
    Ellipsis,
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
import type { Microphone } from '../hooks/useMicrophones'
import { BarTooltip, Popover, useOpenTowards } from './Popover'

const ICON = 14

interface ToolbarProps {
    visible: boolean
    isAdjusting: boolean
    // Where the toolbar sits: in the room the window made for it, or over
    // the bottom of the teleprompter when the window could not grow
    placement: CSSProperties
    isRecognizing: boolean
    isSpeechActive: boolean
    isPaused: boolean
    isCountingDown: boolean
    // Start waits for the speech model of the chosen language
    isDownloadingModel: boolean
    content: string
    isEditing: boolean
    language: string
    langMenuOpen: boolean
    micMenuOpen: boolean
    microphones: Microphone[]
    // null for the system default input
    selectedMic: string | null
    micLevel: number
    onMicChange: (id: string | null) => void
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
const divider = <div className="h-5 w-px mx-0.5 bg-white/15" />
const menuItem =
    'flex items-center gap-2.5 px-4 py-2 text-[11px] text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors'

const speechLanguageLabel = (code: string) => LANGUAGES.find((l) => l.value === code)?.label ?? code

function BarButton({
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
            <BarTooltip label={label} />
        </div>
    )
}

export default function Toolbar(props: ToolbarProps) {
    return <AnimatePresence>{props.visible && <ToolbarBar {...props} />}</AnimatePresence>
}

// What is used while reading stays on the bar; the script actions, used
// before, live in the ⋯ menu with their names spelled out
function ToolbarBar({
    isAdjusting,
    placement,
    isRecognizing,
    isSpeechActive,
    isPaused,
    isCountingDown,
    isDownloadingModel,
    content,
    isEditing,
    language,
    langMenuOpen,
    micMenuOpen,
    microphones,
    selectedMic,
    micLevel,
    onMicChange,
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
    const towards = useOpenTowards()
    const [moreOpen, setMoreOpen] = useState(false)
    const langMenuRef = useRef<HTMLDivElement>(null)
    const langPanelRef = useRef<HTMLDivElement>(null)
    const micMenuRef = useRef<HTMLDivElement>(null)
    const micPanelRef = useRef<HTMLDivElement>(null)
    const moreRef = useRef<HTMLDivElement>(null)
    const morePanelRef = useRef<HTMLDivElement>(null)
    const running = isSpeechActive || isCountingDown
    const systemMic = microphones.find((m) => m.isDefault)
    const currentMic = microphones.find((m) => m.id === selectedMic) ?? systemMic

    // Close the menus on outside click
    useEffect(() => {
        if (!langMenuOpen && !micMenuOpen && !moreOpen) return
        const outside = (target: Node, ...refs: React.RefObject<HTMLElement | null>[]) =>
            !refs.some((r) => r.current?.contains(target))
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (langMenuOpen && outside(target, langMenuRef, langPanelRef)) onLangMenuToggle()
            if (micMenuOpen && outside(target, micMenuRef, micPanelRef)) onMicMenuToggle()
            if (moreOpen && outside(target, moreRef, morePanelRef)) setMoreOpen(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [langMenuOpen, micMenuOpen, moreOpen, onLangMenuToggle, onMicMenuToggle])

    // A menu item does its thing and closes the menu
    const pick = (action: () => void) => () => {
        setMoreOpen(false)
        action()
    }

    const shift = towards === 'down' ? -8 : 8
    return (
        <motion.div
            initial={{ opacity: 0, y: shift }}
            animate={{ opacity: isAdjusting ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: shift }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            // Centered on the point it is placed at
            style={{ ...placement, x: '-50%', height: 40 }}
            className="fixed z-40 flex items-center gap-1 px-1.5 rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg">
            <BarButton
                tour="start"
                label={
                    isDownloadingModel
                        ? t.speechModel.waiting
                        : running
                          ? t.toolbar.stop
                          : t.toolbar.start
                }
                onClick={onToggleListen}
                disabled={!content || isDownloadingModel}
                className={`${running ? 'bg-red-500 text-white hover:bg-red-600' : primary} ${
                    // Session on but the recognizer is (re)connecting
                    isSpeechActive && !isPaused && !isRecognizing ? 'animate-pulse' : ''
                }`}>
                {running ? <Square size={ICON} /> : <Play size={ICON} />}
            </BarButton>

            {isSpeechActive && (
                <BarButton
                    label={isPaused ? t.toolbar.resume : t.toolbar.pause}
                    onClick={onTogglePause}
                    className={isPaused ? 'bg-white text-[#1a1a1a] hover:bg-white/90' : ghost}>
                    {isPaused ? <Play size={ICON} /> : <Pause size={ICON} />}
                </BarButton>
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
                <BarTooltip
                    label={t.toolbar.speechLanguage}
                    hidden={langMenuOpen}
                />
                <Popover
                    anchor={langMenuRef}
                    panelRef={langPanelRef}
                    open={langMenuOpen}
                    width={96}
                    className="flex flex-col py-1">
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
                </Popover>
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
                <BarTooltip
                    label={
                        currentMic
                            ? `${t.toolbar.microphone}: ${currentMic.name}`
                            : t.toolbar.microphone
                    }
                    hidden={micMenuOpen}
                />
                <Popover
                    anchor={micMenuRef}
                    panelRef={micPanelRef}
                    open={micMenuOpen}
                    width={256}
                    className="flex flex-col py-1">
                    <span className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                        {t.mic.title}
                    </span>
                    {[
                        {
                            id: null,
                            name: systemMic
                                ? `${t.mic.systemDefault} (${systemMic.name})`
                                : t.mic.systemDefault,
                        },
                        ...microphones.map((m) => ({ id: m.id as string | null, name: m.name })),
                    ].map((mic) => (
                        <button
                            key={mic.id ?? 'default'}
                            onClick={() => onMicChange(mic.id)}
                            title={mic.name}
                            className={`flex items-center gap-2 px-4 py-1.5 text-[11px] text-left transition-colors ${
                                selectedMic === mic.id
                                    ? 'text-white'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}>
                            <Selected
                                size={12}
                                className={`flex-shrink-0 ${selectedMic === mic.id ? 'text-[#7698fe]' : 'invisible'}`}
                            />
                            <span className="truncate">{mic.name}</span>
                        </button>
                    ))}
                    {microphones.length === 0 && (
                        <span className="px-4 py-1.5 text-[11px] text-white/30">
                            {t.toolbar.noMicrophones}
                        </span>
                    )}
                    <div
                        className="mx-4 my-2 h-1.5 rounded-full bg-white/10 overflow-hidden"
                        title={t.mic.level}>
                        <div
                            className="h-full rounded-full bg-[#4ade80] transition-[width] duration-75"
                            style={{ width: `${Math.round(micLevel * 100)}%` }}
                        />
                    </div>
                    <span className="px-4 pb-2 text-[10px] text-white/40">{t.mic.level}</span>
                </Popover>
            </div>

            {divider}

            <div data-tour="look">{appearance}</div>

            {settings}

            {divider}

            <div
                ref={moreRef}
                data-tour="script"
                className="relative group">
                {/* While editing it finishes the edit in one click */}
                <button
                    onClick={isEditing ? onToggleEdit : () => setMoreOpen((v) => !v)}
                    aria-label={isEditing ? t.toolbar.finishEditing : t.toolbar.more}
                    className={`${iconBtn} ${moreOpen || isEditing ? primary : ghost}`}>
                    {isEditing ? <Check size={ICON} /> : <Ellipsis size={ICON} />}
                </button>
                <BarTooltip
                    label={isEditing ? t.toolbar.finishEditing : t.toolbar.more}
                    hidden={moreOpen}
                />
                <Popover
                    anchor={moreRef}
                    panelRef={morePanelRef}
                    open={moreOpen}
                    width={220}
                    className="flex flex-col py-1">
                    <button
                        onClick={pick(onToggleEdit)}
                        className={menuItem}>
                        <Pencil size={ICON} />
                        {t.toolbar.editScript}
                    </button>
                    <button
                        onClick={pick(onPasteText)}
                        className={menuItem}>
                        <ClipboardPaste size={ICON} />
                        {t.toolbar.pasteScript}
                    </button>
                    <button
                        onClick={pick(onImport)}
                        className={menuItem}>
                        <FileUp size={ICON} />
                        {t.toolbar.importScript}
                    </button>
                    <button
                        onClick={pick(onClear)}
                        className={`${menuItem} hover:!bg-red-500/80`}>
                        <Trash2 size={ICON} />
                        {t.toolbar.clearScript}
                    </button>
                    <div className="h-px my-1 bg-white/10" />
                    <button
                        onClick={pick(onShowTutorial)}
                        className={menuItem}>
                        <CircleHelp size={ICON} />
                        {t.settings.tutorial}
                    </button>
                </Popover>
            </div>
        </motion.div>
    )
}
