import { useState, useRef, useEffect } from 'react'
import {
    EyeOff,
    Globe,
    GraduationCap,
    MousePointerClick,
    PanelTop,
    RotateCcw,
    Settings,
} from 'lucide-react'
import { useT, UI_LANGUAGES } from '../i18n'
import type { GlobalAction, ShortcutBindings } from '../hooks/useGlobalShortcuts'
import { displayShortcut } from '../lib/shortcuts'
import Switch from './Switch'
import ShortcutsSection from './ShortcutsSection'
import AiConnectorSection from './AiConnectorSection'
import { BarTooltip, Popover } from './Popover'
import ReadingSettings from './ReadingSettings'
import { Row, Section, selectClass } from './SettingsRows'
import UpdatesSection from './UpdatesSection'
import type { useUpdater } from '../hooks/useUpdater'
import type { Scrolling } from '../lib/scrolling'

const PANEL_WIDTH = 288

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
            if (!ref.current?.contains(target) && !panelRef.current?.contains(target))
                setOpen(false)
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
                <Section
                    title={t.settings.sectionReading}
                    first
                />
                <ReadingSettings
                    scrolling={scrolling}
                    onScrollingChange={onScrollingChange}
                    readingLine={readingLine}
                    onToggleReadingLine={onToggleReadingLine}
                    countdownSeconds={countdownSeconds}
                    onCountdownSecondsChange={onCountdownSecondsChange}
                    targetMinutes={targetMinutes}
                    onTargetMinutesChange={onTargetMinutesChange}
                />

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
                        className={selectClass}>
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

                <UpdatesSection
                    autoUpdate={autoUpdate}
                    onToggleAutoUpdate={onToggleAutoUpdate}
                    updater={updater}
                />

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
