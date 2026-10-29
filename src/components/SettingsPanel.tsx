import { useState, useRef, useEffect } from 'react'
import {
    EyeOff,
    Globe,
    GraduationCap,
    MousePointerClick,
    PanelTop,
    RotateCcw,
    Settings as SettingsIcon,
} from 'lucide-react'
import { useT, UI_LANGUAGES } from '../i18n'
import type { GlobalAction } from '../hooks/useGlobalShortcuts'
import { displayShortcut } from '../lib/shortcuts'
import Switch from './Switch'
import ShortcutsSection from './ShortcutsSection'
import AiConnectorSection from './AiConnectorSection'
import { BarTooltip, Popover } from './Popover'
import ReadingSettings from './ReadingSettings'
import { Row, Section, selectClass } from './SettingsRows'
import UpdatesSection from './UpdatesSection'
import type { useUpdater } from '../hooks/useUpdater'
import type { Settings } from '../hooks/useSettings'

const PANEL_WIDTH = 288

interface SettingsPanelProps {
    settings: Settings
    updater: ReturnType<typeof useUpdater>
    // Global shortcuts the system refused (another app holds them)
    failedShortcuts: GlobalAction[]
    onRecordingShortcut: (recording: boolean) => void
    onUiLanguageChange: (val: string) => void
    onToggleTitleBar: () => void
    onShowTutorial: () => void
    onReset: () => void
}

export default function SettingsPanel({
    settings,
    updater,
    failedShortcuts,
    onRecordingShortcut,
    onUiLanguageChange,
    onToggleTitleBar,
    onShowTutorial,
    onReset,
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
                <SettingsIcon size={14} />
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
                <ReadingSettings settings={settings} />

                <Section title={t.settings.sectionWindow} />
                <Row
                    icon={<EyeOff size={14} />}
                    label={t.settings.hideFromCapture}
                    hint={t.settings.hideFromCaptureHint}>
                    <Switch
                        on={settings.hiddenFromCapture}
                        onToggle={() => settings.setHiddenFromCapture((v) => !v)}
                    />
                </Row>

                <Row
                    icon={<MousePointerClick size={14} />}
                    label={t.settings.clickThrough}
                    hint={t.settings.clickThroughHint(
                        displayShortcut(settings.shortcutBindings.toggleClickThrough),
                    )}>
                    <Switch
                        on={settings.clickThrough}
                        onToggle={() => {
                            setOpen(false)
                            settings.setClickThrough((v) => !v)
                        }}
                    />
                </Row>

                <Row
                    icon={<PanelTop size={14} />}
                    label={t.settings.titleBar}>
                    <Switch
                        on={settings.titleBarVisible}
                        onToggle={onToggleTitleBar}
                    />
                </Row>

                <Section title={t.settings.sectionGeneral} />
                <Row
                    icon={<Globe size={14} />}
                    label={t.settings.interfaceLanguage}>
                    <select
                        value={settings.uiLanguage}
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
                    enabled={settings.aiConnectorEnabled}
                    onToggleEnabled={() => settings.setAiConnectorEnabled((v) => !v)}
                />

                <ShortcutsSection
                    enabled={settings.shortcutsEnabled}
                    bindings={settings.shortcutBindings}
                    failed={failedShortcuts}
                    onToggleEnabled={() => settings.setShortcutsEnabled((v) => !v)}
                    onChange={settings.setShortcut}
                    onReset={settings.resetShortcuts}
                    onRecordingChange={onRecordingShortcut}
                />

                <UpdatesSection
                    autoUpdate={settings.autoUpdate}
                    onToggleAutoUpdate={() => settings.setAutoUpdate((v) => !v)}
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
