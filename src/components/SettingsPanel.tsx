import { useState, useRef, useEffect } from 'react'
import {
    EyeOff,
    Globe,
    GraduationCap,
    MousePointerClick,
    RefreshCw,
    PanelTop,
    RotateCcw,
    Settings,
    Timer,
    Hourglass,
    ScanLine,
    MoveVertical,
} from 'lucide-react'
import { useT, UI_LANGUAGES } from '../i18n'
import type { GlobalAction, ShortcutBindings } from '../hooks/useGlobalShortcuts'
import { displayShortcut } from '../lib/shortcuts'
import Switch from './Switch'
import ShortcutsSection from './ShortcutsSection'
import AiConnectorSection from './AiConnectorSection'
import { BarTooltip, Popover } from './Popover'
import type { useUpdater } from '../hooks/useUpdater'
import type { Scrolling } from '../lib/scrolling'

const PANEL_WIDTH = 288
const COUNTDOWN_OPTIONS = [0, 3, 5, 10]


interface SettingsPanelProps {
    uiLanguage: string
    hiddenFromCapture: boolean
    titleBarVisible: boolean
    onUiLanguageChange: (val: string) => void
    onToggleHiddenFromCapture: () => void
    onToggleTitleBar: () => void
    onReset: () => void
    onShowTutorial: () => void
    targetMinutes: number
    onTargetMinutesChange: (val: number) => void
    readingLine: boolean
    onToggleReadingLine: () => void
    scrolling: Scrolling
    onScrollingChange: (value: Scrolling) => void
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
    countdownSeconds: number
    onCountdownSecondsChange: (val: number) => void
    aiConnectorEnabled: boolean
    onToggleAiConnector: () => void
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

// Heading that groups the rows under it
function Section({ title, first }: { title: string; first?: boolean }) {
    return (
        <div
            className={`px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-white/40 ${
                first ? '' : 'mt-1 border-t border-white/10'
            }`}>
            {title}
        </div>
    )
}

export default function SettingsPanel({
    uiLanguage,
    hiddenFromCapture,
    titleBarVisible,
    onUiLanguageChange,
    onToggleHiddenFromCapture,
    onToggleTitleBar,
    onReset,
    onShowTutorial,
    targetMinutes,
    onTargetMinutesChange,
    readingLine,
    onToggleReadingLine,
    scrolling,
    onScrollingChange,
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
    countdownSeconds,
    onCountdownSecondsChange,
    aiConnectorEnabled,
    onToggleAiConnector,
}: SettingsPanelProps) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // Close on outside click or Esc
    useEffect(() => {
        if (!open) return
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (!ref.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
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
            className="relative group">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={t.settings.title}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    open ? 'bg-[#445ade] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                <Settings size={14} />
            </button>
            <BarTooltip
                label={t.settings.title}
                hidden={open}
            />

            <Popover
                anchor={ref}
                panelRef={panelRef}
                open={open}
                width={PANEL_WIDTH}>
                <Section title={t.settings.sectionReading} first />
                <div className="px-4 py-2.5 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="text-white/50 flex-shrink-0">
                            <MoveVertical size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-white">{t.scrolling.title}</div>
                            <div className="text-[10px] text-white/40 leading-snug">
                                {scrolling.mode === 'fixed'
                                    ? t.scrolling.fixedHint
                                    : t.scrolling.aheadHint}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1 pl-[26px]">
                        {(['ahead', 'fixed'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onScrollingChange({ ...scrolling, mode })}
                                className={`flex-1 h-6 rounded-md text-[10px] transition-colors ${
                                    scrolling.mode === mode
                                        ? 'bg-[#445ade] text-white'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}>
                                {t.scrolling[mode]}
                            </button>
                        ))}
                    </div>
                    {scrolling.mode === 'ahead' ? (
                        <label className="flex items-center justify-between pl-[26px] text-[10px] text-white/60">
                            {t.scrolling.linesBelow}
                            <input
                                type="number"
                                min={1}
                                max={6}
                                value={scrolling.linesBelow}
                                onChange={(e) => {
                                    const linesBelow = parseInt(e.target.value)
                                    if (linesBelow >= 1 && linesBelow <= 6)
                                        onScrollingChange({ ...scrolling, linesBelow })
                                }}
                                className="w-10 h-6 rounded-md bg-white/10 text-center text-[11px] text-white tabular-nums focus:outline-none"
                            />
                        </label>
                    ) : (
                        <label className="flex flex-col gap-1 pl-[26px] text-[10px] text-white/60">
                            <span className="flex justify-between">
                                {t.scrolling.position}
                                <span className="tabular-nums">
                                    {Math.round(scrolling.anchor * 100)}%
                                </span>
                            </span>
                            <input
                                type="range"
                                min={0.2}
                                max={0.6}
                                step={0.05}
                                value={scrolling.anchor}
                                onChange={(e) =>
                                    onScrollingChange({ ...scrolling, anchor: Number(e.target.value) })
                                }
                                className="accent-[#445ade]"
                            />
                        </label>
                    )}
                </div>

                {scrolling.mode === 'fixed' && (
                    <Row
                        icon={<ScanLine size={14} />}
                        label={t.settings.readingLine}
                        hint={t.settings.readingLineHint}>
                        <Switch
                            on={readingLine}
                            onToggle={onToggleReadingLine}
                        />
                    </Row>
                )}

                <Row
                    icon={<Hourglass size={14} />}
                    label={t.settings.countdown}
                    hint={t.settings.countdownHint}>
                    <select
                        value={countdownSeconds}
                        onChange={(e) => onCountdownSecondsChange(Number(e.target.value))}
                        className="bg-white/10 text-white text-[11px] rounded-md px-2 py-1 outline-none cursor-pointer">
                        {COUNTDOWN_OPTIONS.map((s) => (
                            <option
                                key={s}
                                value={s}
                                className="bg-[#242424]">
                                {s === 0 ? t.settings.countdownOff : `${s} s`}
                            </option>
                        ))}
                    </select>
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

                <Section title={t.settings.sectionWindow} />
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
                    icon={<PanelTop size={14} />}
                    label={t.settings.titleBar}>
                    <Switch
                        on={titleBarVisible}
                        onToggle={onToggleTitleBar}
                    />
                </Row>

                <Section title={t.settings.sectionGeneral} />
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

                <AiConnectorSection
                    enabled={aiConnectorEnabled}
                    onToggleEnabled={onToggleAiConnector}
                />

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
            </Popover>
        </div>
    )
}
