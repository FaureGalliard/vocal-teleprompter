import { useState, useEffect } from 'react'
import { AlertTriangle, Keyboard, RotateCcw } from 'lucide-react'
import { useT } from '../i18n'
import Switch from './Switch'
import {
    GLOBAL_SHORTCUTS,
    type GlobalAction,
    type ShortcutBindings,
} from '../hooks/useGlobalShortcuts'
import { acceleratorFromEvent, displayShortcut } from '../lib/shortcuts'

interface ShortcutsSectionProps {
    enabled: boolean
    bindings: ShortcutBindings
    failed: GlobalAction[]
    onToggleEnabled: () => void
    onChange: (action: GlobalAction, accelerator: string) => void
    onReset: () => void
    // While recording a new combination the global ones must be released,
    // or the system would swallow the key press before the app sees it
    onRecordingChange: (recording: boolean) => void
}

export default function ShortcutsSection({
    enabled,
    bindings,
    failed,
    onToggleEnabled,
    onChange,
    onReset,
    onRecordingChange,
}: ShortcutsSectionProps) {
    const t = useT()
    const [recording, setRecording] = useState<GlobalAction | null>(null)
    const [taken, setTaken] = useState<GlobalAction | null>(null)

    useEffect(() => {
        onRecordingChange(recording !== null)
        if (!recording) return
        const onKeyDown = (e: KeyboardEvent) => {
            e.preventDefault()
            // Keep the settings panel and global shortcuts from reacting too
            e.stopPropagation()
            if (e.key === 'Escape') {
                setRecording(null)
                return
            }
            const accelerator = acceleratorFromEvent(e)
            if (!accelerator) return
            const owner = (Object.keys(bindings) as GlobalAction[]).find(
                (a) => a !== recording && bindings[a] === accelerator,
            )
            if (owner) {
                setTaken(owner)
                return
            }
            onChange(recording, accelerator)
            setTaken(null)
            setRecording(null)
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => document.removeEventListener('keydown', onKeyDown, true)
        // onChange and onRecordingChange are recreated on every render upstream
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recording, bindings])

    const isDefault = (Object.keys(GLOBAL_SHORTCUTS) as GlobalAction[]).every(
        (a) => bindings[a] === GLOBAL_SHORTCUTS[a],
    )

    return (
        <div className="border-t border-white/10 mt-1 px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
                <Keyboard
                    size={12}
                    className="text-white/40"
                />
                <span className="flex-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                    {t.shortcuts.title}
                </span>
                <Switch
                    on={enabled}
                    onToggle={onToggleEnabled}
                />
            </div>

            <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
                {(Object.keys(GLOBAL_SHORTCUTS) as GlobalAction[]).map((action) => (
                    <div
                        key={action}
                        className="flex items-center justify-between gap-2 py-0.5 text-[11px]">
                        <span className="text-white/70 flex items-center gap-1 min-w-0">
                            {failed.includes(action) && (
                                <span title={t.shortcuts.unavailable}>
                                    <AlertTriangle
                                        size={11}
                                        className="text-[#facc15] flex-shrink-0"
                                    />
                                </span>
                            )}
                            <span className="truncate">{t.shortcuts[action]}</span>
                        </span>
                        <button
                            onClick={() => {
                                setTaken(null)
                                setRecording(recording === action ? null : action)
                            }}
                            title={t.shortcuts.change}
                            className={`font-mono text-[10px] rounded px-1.5 py-0.5 flex-shrink-0 transition-colors ${
                                recording === action
                                    ? 'bg-[#445ade] text-white animate-pulse'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            }`}>
                            {recording === action
                                ? t.shortcuts.pressKeys
                                : displayShortcut(bindings[action])}
                        </button>
                    </div>
                ))}

                {taken && (
                    <div className="text-[10px] text-[#facc15] mt-1">
                        {t.shortcuts.taken(t.shortcuts[taken])}
                    </div>
                )}
                {failed.length > 0 && (
                    <div className="text-[10px] text-white/40 mt-1">{t.shortcuts.unavailable}</div>
                )}

                {!isDefault && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-1.5 mt-1.5 text-[10px] text-white/40 hover:text-white transition-colors">
                        <RotateCcw size={10} />
                        {t.shortcuts.resetDefaults}
                    </button>
                )}
            </div>
        </div>
    )
}
