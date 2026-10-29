import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Contrast, Minus, Palette, Plus } from 'lucide-react'
import { useT } from '../i18n'
import TypographyControls from './TypographyControls'
import Switch from './Switch'
import { BarTooltip, Popover } from './Popover'
import type { Settings } from '../hooks/useSettings'

interface AppearancePanelProps {
    settings: Settings
    // The toolbar fades out while a control is dragged so the change shows on
    // the script; the panel lives in a portal so it stays visible meanwhile
    onAdjustStart: () => void
}

const PANEL_WIDTH = 256

const label = 'text-[10px] font-medium uppercase tracking-wide text-white/40'
const stepper =
    'flex items-center justify-center w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 transition-colors'

// Text size, colors and typography behind one toolbar button
export default function AppearancePanel({ settings, onAdjustStart }: AppearancePanelProps) {
    const {
        fontSize,
        setFontSize: onFontSizeChange,
        bgColor,
        setBgColor: onBgColorChange,
        bgOpacity,
        setBgOpacity: onBgOpacityChange,
        textColor,
        setTextColor: onTextColorChange,
        typography,
        setTypography: onTypographyChange,
        autoContrast,
    } = settings
    const onToggleAutoContrast = () => settings.setAutoContrast((v) => !v)
    const t = useT()
    const [open, setOpen] = useState(false)
    const anchorRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target))
                setOpen(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [open])

    const setSize = (value: number) => onFontSizeChange(Math.max(6, Math.min(200, value)))

    return (
        <div
            ref={anchorRef}
            className="relative group">
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                aria-label={t.appearance.title}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    open ? 'bg-[#445ade] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                <Palette size={14} />
            </button>
            <BarTooltip
                label={t.appearance.title}
                hidden={open}
            />

            <Popover
                anchor={anchorRef}
                panelRef={panelRef}
                open={open}
                width={PANEL_WIDTH}
                className="p-3 flex flex-col gap-3 text-[11px] text-white">
                <div className="flex items-center justify-between">
                    <span className={label}>{t.toolbar.size}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setSize(fontSize - 2)}
                            className={stepper}>
                            <Minus size={12} />
                        </button>
                        <input
                            type="number"
                            min={6}
                            max={200}
                            value={fontSize}
                            onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (!isNaN(val)) setSize(val)
                            }}
                            className="w-10 h-6 rounded-md bg-white/10 text-center tabular-nums focus:outline-none"
                        />
                        <button
                            onClick={() => setSize(fontSize + 2)}
                            className={stepper}>
                            <Plus size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className={label}>{t.toolbar.background}</span>
                    <div className="flex items-center gap-2">
                        <label
                            className="relative w-6 h-6 rounded-md overflow-hidden border border-white/20 flex-shrink-0 cursor-pointer"
                            style={{ backgroundColor: bgColor }}>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => onBgColorChange(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={bgOpacity}
                            onMouseDown={onAdjustStart}
                            onChange={(e) => onBgOpacityChange(Number(e.target.value))}
                            title={t.appearance.opacity}
                            className="flex-1 accent-[#445ade]"
                        />
                        <span className="w-8 text-right text-white/50 tabular-nums">
                            {Math.round(bgOpacity * 100)}%
                        </span>
                    </div>
                </div>

                <div
                    className="flex flex-col gap-1.5"
                    onMouseDown={(e) => {
                        // Dragging inside the picker, not clicking around it
                        if ((e.target as HTMLElement).closest('.react-colorful')) onAdjustStart()
                    }}>
                    <span className="flex items-center justify-between">
                        <span className={label}>{t.toolbar.text}</span>
                        <span className="font-mono text-[10px] text-white/40">{textColor}</span>
                    </span>
                    <HexColorPicker
                        color={textColor}
                        onChange={onTextColorChange}
                        style={{ width: '100%', height: 120 }}
                    />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <Contrast
                        size={12}
                        className="flex-shrink-0 text-white/50"
                    />
                    <span className="flex-1 min-w-0">
                        <span className="block">{t.settings.autoContrast}</span>
                        <span className="block text-[10px] text-white/40 leading-snug">
                            {t.settings.autoContrastHint}
                        </span>
                    </span>
                    <Switch
                        on={autoContrast}
                        onToggle={onToggleAutoContrast}
                    />
                </label>

                <div className="h-px bg-white/10" />
                <span className={label}>{t.typography.title}</span>
                <TypographyControls
                    value={typography}
                    onChange={onTypographyChange}
                    onAdjustStart={onAdjustStart}
                />
            </Popover>
        </div>
    )
}
