import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Contrast,
    EyeOff,
    Globe,
    GraduationCap,
    MousePointerClick,
    RefreshCw,
    PanelTop,
    RotateCcw,
    Settings,
    Timer,
    ScanLine,
} from 'lucide-react'
import { useT, UI_LANGUAGES } from '../i18n'
import type { GlobalAction, ShortcutBindings } from '../hooks/useGlobalShortcuts'
import { displayShortcut } from '../lib/shortcuts'
import Switch from './Switch'
import ShortcutsSection from './ShortcutsSection'
import type { useUpdater } from '../hooks/useUpdater'

const PANEL_WIDTH = 288


interface SettingsPanelProps {
    uiLanguage: string
    hiddenFromCapture: boolean
    autoContrast: boolean
    titleBarVisible: boolean
    onUiLanguageChange: (val: string) => void
    onToggleHiddenFromCapture: () => void
    onToggleAutoContrast: () => void
    onToggleTitleBar: () => void
    onReset: () => void
    onShowTutorial: () => void
    targetMinutes: number
    onTargetMinutesChange: (val: number) => void
    readingLine: boolean
    onToggleReadingLine: () => void
    clickThrough: boolean
    onToggleClickThrough: () => void
    autoUpdate: boolean
    onToggleAutoUpdate: () => void
    updater: ReturnType<typeof useUpdater>
    shortcutsEnabled: boolean
    shortcutBindings: ShortcutBindings
    failedShortcuts: GlobalAction[]
    onToggleShortcuts: () => void
    onShortcutChange: (action: GlobalAction, accelerator: string) => void
    onResetShortcuts: () => void
    onRecordingShortcut: (recording: boolean) => void
}

function Row({
    icon,
    label,
    hint,
    children,
}: {
    icon: React.ReactNode
    label: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-white/50 flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white">{label}</div>
                {hint && <div className="text-[10px] text-white/40 leading-snug">{hint}</div>}
            </div>
            {children}
        </div>
    )
}

export default function SettingsPanel({
    uiLanguage,
    hiddenFromCapture,
    autoContrast,
    titleBarVisible,
    onUiLanguageChange,
    onToggleHiddenFromCapture,
    onToggleAutoContrast,
    onToggleTitleBar,
    onReset,
    onShowTutorial,
    targetMinutes,
    onTargetMinutesChange,
    readingLine,
    onToggleReadingLine,
    clickThrough,
    onToggleClickThrough,
    autoUpdate,
    onToggleAutoUpdate,
    updater,
    shortcutsEnabled,
    shortcutBindings,
    failedShortcuts,
    onToggleShortcuts,
    onShortcutChange,
    onResetShortcuts,
    onRecordingShortcut,
}: SettingsPanelProps) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    // Open toward whichever side has room; the gear may wrap to the left
    const [alignLeft, setAlignLeft] = useState(false)
    // Fit the panel between the button and the bottom of the window; it
    // scrolls when the window is shorter than the panel
    const [maxHeight, setMaxHeight] = useState<number>()
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click or Esc
    useEffect(() => {
        if (!open) return
        const onMouseDown = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            // Don't let the global Esc shortcut stop listening as well
            e.stopPropagation()
            setOpen(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onMouseDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    useEffect(() => {
        if (!open) setConfirmReset(false)
    }, [open])

    return (
        <div
            ref={ref}
            data-tour="settings"
            className="relative">
            <button
                onClick={() => {
                    const rect = ref.current?.getBoundingClientRect()
                    if (rect) {
                        setAlignLeft(rect.right < PANEL_WIDTH + 8)
                        setMaxHeight(Math.max(160, window.innerHeight - rect.bottom - 16))
                    }
                    setOpen((v) => !v)
                }}
                title={t.settings.title}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                    open ? 'bg-[#445ade] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                <Settings size={14} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        style={{ width: PANEL_WIDTH, maxHeight }}
                        className={`absolute top-full mt-2 z-50 ${alignLeft ? 'left-0' : 'right-0'} bg-[#242424] border border-white/10 rounded-xl shadow-xl overflow-y-auto`}>
                        <div className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                            {t.settings.title}
                        </div>

                        <Row
                            icon={<Globe size={14} />}
                            label={t.settings.interfaceLanguage}>
                            <select
                                value={uiLanguage}
                                onChange={(e) => onUiLanguageChange(e.target.value)}
                                className="bg-white/10 text-white text-[11px] rounded-md px-2 py-1 outline-none cursor-pointer">
                                {UI_LANGUAGES.map((l) => (
                                    <option
                                        key={l.value}
                                        value={l.value}
                                        className="bg-[#242424]">
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </Row>

                        <Row
                            icon={<EyeOff size={14} />}
                            label={t.settings.hideFromCapture}
                            hint={t.settings.hideFromCaptureHint}>
                            <Switch
                                on={hiddenFromCapture}
                                onToggle={onToggleHiddenFromCapture}
                            />
                        </Row>

                        <Row
                            icon={<Contrast size={14} />}
                            label={t.settings.autoContrast}
                            hint={t.settings.autoContrastHint}>
                            <Switch
                                on={autoContrast}
                                onToggle={onToggleAutoContrast}
                            />
                        </Row>

                        <Row
                            icon={<MousePointerClick size={14} />}
                            label={t.settings.clickThrough}
                            hint={t.settings.clickThroughHint(
                                displayShortcut(shortcutBindings.toggleClickThrough),
                            )}>
                            <Switch
                                on={clickThrough}
                                onToggle={() => {
                                    setOpen(false)
                                    onToggleClickThrough()
                                }}
                            />
                        </Row>

                        <Row
                            icon={<ScanLine size={14} />}
                            label={t.settings.readingLine}
                            hint={t.settings.readingLineHint}>
                            <Switch
                                on={readingLine}
                                onToggle={onToggleReadingLine}
                            />
                        </Row>

                        <Row
                            icon={<Timer size={14} />}
                            label={t.settings.targetDuration}
                            hint={t.settings.targetDurationHint}>
                            <div className="flex items-center gap-1 bg-white/10 rounded-md px-2 py-1">
                                <input
                                    type="number"
                                    min={0}
                                    max={180}
                                    value={targetMinutes}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value)
                                        onTargetMinutesChange(
                                            isNaN(val) ? 0 : Math.max(0, Math.min(180, val)),
                                        )
                                    }}
                                    className="w-8 text-[11px] text-white bg-transparent text-right focus:outline-none"
                                />
                                <span className="text-[10px] text-white/40">min</span>
                            </div>
                        </Row>

                        <Row
                            icon={<PanelTop size={14} />}
                            label={t.settings.titleBar}>
                            <Switch
                                on={titleBarVisible}
                                onToggle={onToggleTitleBar}
                            />
                        </Row>

                        <ShortcutsSection
                            enabled={shortcutsEnabled}
                            bindings={shortcutBindings}
                            failed={failedShortcuts}
                            onToggleEnabled={onToggleShortcuts}
                            onChange={onShortcutChange}
                            onReset={onResetShortcuts}
                            onRecordingChange={onRecordingShortcut}
                        />

                        <div className="border-t border-white/10">
                            <Row
                                icon={<RefreshCw size={14} />}
                                label={t.updates.autoCheck}
                                hint={
                                    updater.currentVersion
                                        ? t.updates.version(updater.currentVersion)
                                        : undefined
                                }>
                                <Switch
                                    on={autoUpdate}
                                    onToggle={onToggleAutoUpdate}
                                />
                            </Row>
                            <div className="flex items-center gap-3 px-4 pb-2.5 -mt-1">
                                {updater.status === 'available' ? (
                                    <button
                                        onClick={updater.install}
                                        className="text-[11px] px-3 py-1 rounded-full bg-[#445ade] hover:bg-[#3448c5] text-white transition-colors">
                                        {t.updates.installVersion(updater.newVersion ?? '')}
                                    </button>
                                ) : (
                                    <button
                                        onClick={updater.checkForUpdates}
                                        disabled={
                                            updater.status === 'checking' ||
                                            updater.status === 'downloading'
                                        }
                                        className="text-[11px] px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 transition-colors">
                                        {t.updates.check}
                                    </button>
                                )}
                                <span className="text-[10px] text-white/40">
                                    {updater.status === 'checking' && t.updates.checking}
                                    {updater.status === 'up-to-date' && t.updates.upToDate}
                                    {updater.status === 'failed' && t.updates.failed}
                                    {updater.status === 'downloading' &&
                                        t.updates.downloading(Math.round(updater.progress * 100))}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 px-4 py-2.5 flex flex-col gap-2.5">
                            <button
                                onClick={() => {
                                    setOpen(false)
                                    onShowTutorial()
                                }}
                                className="flex items-center gap-2 text-[11px] text-white/50 hover:text-white transition-colors">
                                <GraduationCap size={12} />
                                {t.settings.tutorial}
                            </button>
                            <button
                                onClick={() => (confirmReset ? onReset() : setConfirmReset(true))}
                                className={`flex items-center gap-2 text-[11px] transition-colors ${
                                    confirmReset
                                        ? 'text-red-400 hover:text-red-300'
                                        : 'text-white/50 hover:text-white'
                                }`}>
                                <RotateCcw size={12} />
                                {confirmReset ? t.settings.resetConfirm : t.settings.reset}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
