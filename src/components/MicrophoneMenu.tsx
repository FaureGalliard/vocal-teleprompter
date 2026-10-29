import { useCallback, useRef, useState } from 'react'
import { Check as Selected, Mic } from 'lucide-react'
import { useT } from '../i18n'
import type { Microphone } from '../hooks/useMicrophones'
import { useOutsideClick } from '../hooks/useOutsideClick'
import { useMicLevel } from '../hooks/useMicLevel'
import { ghost, ICON, iconBtn, primary } from './BarButton'
import { BarTooltip, Popover } from './Popover'

// Which microphone to listen to, with a level meter to test it
export default function MicrophoneMenu({
    microphones,
    onRefresh,
    selected,
    listening,
    onChange,
}: {
    microphones: Microphone[]
    // Looks for microphones plugged in since the list was made
    onRefresh: () => void
    // null for the system default input
    selected: string | null
    // While listening the speech engine already reports the level
    listening: boolean
    onChange: (id: string | null) => void
}) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const close = useCallback(() => setOpen(false), [])
    useOutsideClick([ref, panelRef], open, close)
    // Measured while the menu is open, to test the input
    const level = useMicLevel(open, listening, selected)
    const toggle = () => {
        if (!open) onRefresh()
        setOpen((v) => !v)
    }
    const systemMic = microphones.find((m) => m.isDefault)
    const currentMic = microphones.find((m) => m.id === selected) ?? systemMic

    return (
        <div
            ref={ref}
            data-tour="microphone"
            className="relative group">
            <button
                onClick={toggle}
                aria-label={t.toolbar.microphone}
                className={`${iconBtn} ${open ? primary : ghost}`}>
                <Mic size={ICON} />
            </button>
            <BarTooltip
                label={
                    currentMic
                        ? `${t.toolbar.microphone}: ${currentMic.name}`
                        : t.toolbar.microphone
                }
                hidden={open}
            />
            <Popover
                anchor={ref}
                panelRef={panelRef}
                open={open}
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
                        onClick={() => {
                            onChange(mic.id)
                            close()
                        }}
                        title={mic.name}
                        className={`flex items-center gap-2 px-4 py-1.5 text-[11px] text-left transition-colors ${
                            selected === mic.id
                                ? 'text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}>
                        <Selected
                            size={12}
                            className={`flex-shrink-0 ${selected === mic.id ? 'text-[#7698fe]' : 'invisible'}`}
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
                        style={{ width: `${Math.round(level * 100)}%` }}
                    />
                </div>
                <span className="px-4 pb-2 text-[10px] text-white/40">{t.mic.level}</span>
            </Popover>
        </div>
    )
}
