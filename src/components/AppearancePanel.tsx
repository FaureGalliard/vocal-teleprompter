import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HexColorPicker } from 'react-colorful'
import { Minus, Palette, Plus } from 'lucide-react'
import { useT } from '../i18n'
import TypographyControls from './TypographyControls'
import { RailTooltip } from './Toolbar'
import type { Typography } from '../lib/typography'

interface AppearancePanelProps {
    fontSize: number
    onFontSizeChange: (value: number) => void
    bgColor: string
    bgOpacity: number
    onBgColorChange: (value: string) => void
    onBgOpacityChange: (value: number) => void
    textColor: string
    onTextColorChange: (value: string) => void
    typography: Typography
    onTypographyChange: (value: Typography) => void
    // The toolbar fades out while a control is dragged so the change shows on
    // the script; the panel lives in a portal so it stays visible meanwhile
    onAdjustStart: () => void
}

const PANEL_WIDTH = 256

const label = 'text-[10px] font-medium uppercase tracking-wide text-white/40'
const stepper =
    'flex items-center justify-center w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 transition-colors'

// Text size, colors and typography behind one toolbar button
export default function AppearancePanel({
    fontSize,
    onFontSizeChange,
    bgColor,
    bgOpacity,
    onBgColorChange,
    onBgOpacityChange,
    textColor,
    onTextColorChange,
    typography,
    onTypographyChange,
    onAdjustStart,
}: AppearancePanelProps) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 400 })
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

    const toggle = () => {
        // Opens to the left of the toolbar, as high as fits
        const rect = buttonRef.current?.getBoundingClientRect()
        if (rect) {
            const top = Math.max(8, Math.min(rect.top, window.innerHeight - 420))
            setPosition({
                top,
                left: Math.max(8, rect.left - PANEL_WIDTH - 8),
                maxHeight: window.innerHeight - top - 8,
            })
        }
        setOpen((v) => !v)
    }

    const setSize = (value: number) => onFontSizeChange(Math.max(6, Math.min(200, value)))

    return (
        <div className="relative group">
            <button
                ref={buttonRef}
                onClick={toggle}
                aria-label={t.appearance.title}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    open ? 'bg-[#445ade] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                <Palette size={14} />
            </button>
            <RailTooltip
                label={t.appearance.title}
                hidden={open}
            />

            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.14, ease: 'easeOut' }}
                            style={{ position: 'fixed', width: PANEL_WIDTH, ...position, zIndex: 9999 }}
                            className="overflow-y-auto p-3 flex flex-col gap-3 bg-[#242424] border border-white/10 rounded-xl shadow-xl text-[11px] text-white">
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

                            <div className="h-px bg-white/10" />
                            <span className={label}>{t.typography.title}</span>
                            <TypographyControls
                                value={typography}
                                onChange={onTypographyChange}
                                onAdjustStart={onAdjustStart}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </div>
    )
}
