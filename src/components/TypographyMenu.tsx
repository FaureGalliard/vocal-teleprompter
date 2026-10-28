import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlignCenter, AlignLeft, RotateCcw, Type } from 'lucide-react'
import { useT } from '../i18n'
import { DEFAULT_TYPOGRAPHY, FONTS, type FontKey, type Typography } from '../lib/typography'

interface TypographyMenuProps {
    value: Typography
    onChange: (value: Typography) => void
    // Hide the toolbar while dragging a slider so the text change shows
    onAdjustStart: () => void
}

const WEIGHTS: Typography['weight'][] = [400, 600, 700]

const segment = (active: boolean) =>
    `flex-1 h-6 rounded-md text-[10px] transition-colors ${
        active ? 'bg-[#445ade] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
    }`

export default function TypographyMenu({ value, onChange, onAdjustStart }: TypographyMenuProps) {
    const t = useT()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const set = (patch: Partial<Typography>) => onChange({ ...value, ...patch })

    useEffect(() => {
        if (!open) return
        const onMouseDown = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [open])

    return (
        <div
            ref={ref}
            className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                title={t.typography.title}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                    open ? 'bg-[#445ade] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                <Type size={14} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-2 z-50 w-60 p-3 flex flex-col gap-3 bg-[#242424] border border-white/10 rounded-xl shadow-xl text-[11px] text-white">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                            {t.typography.title}
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                            {(Object.keys(FONTS) as FontKey[]).map((font) => (
                                <button
                                    key={font}
                                    onClick={() => set({ font })}
                                    style={{ fontFamily: FONTS[font] }}
                                    className={`h-7 rounded-md text-[12px] transition-colors ${
                                        value.font === font
                                            ? 'bg-[#445ade] text-white'
                                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                                    }`}>
                                    {t.typography.fonts[font]}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1">
                            {WEIGHTS.map((weight) => (
                                <button
                                    key={weight}
                                    onClick={() => set({ weight })}
                                    style={{ fontWeight: weight }}
                                    className={segment(value.weight === weight)}>
                                    {t.typography.weights[weight]}
                                </button>
                            ))}
                        </div>

                        <label className="flex flex-col gap-1">
                            <span className="flex justify-between text-white/60">
                                {t.typography.lineHeight}
                                <span className="tabular-nums">{value.lineHeight.toFixed(1)}</span>
                            </span>
                            <input
                                type="range"
                                min={1.1}
                                max={2.6}
                                step={0.1}
                                value={value.lineHeight}
                                onMouseDown={onAdjustStart}
                                onChange={(e) => set({ lineHeight: Number(e.target.value) })}
                                className="accent-[#445ade]"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="flex justify-between text-white/60">
                                {t.typography.width}
                                <span className="tabular-nums">{value.width}%</span>
                            </span>
                            <input
                                type="range"
                                min={40}
                                max={100}
                                step={5}
                                value={value.width}
                                onMouseDown={onAdjustStart}
                                onChange={(e) => set({ width: Number(e.target.value) })}
                                className="accent-[#445ade]"
                            />
                        </label>

                        <div className="flex gap-1">
                            <button
                                onClick={() => set({ align: 'center' })}
                                title={t.typography.alignCenter}
                                className={`${segment(value.align === 'center')} flex items-center justify-center`}>
                                <AlignCenter size={13} />
                            </button>
                            <button
                                onClick={() => set({ align: 'left' })}
                                title={t.typography.alignLeft}
                                className={`${segment(value.align === 'left')} flex items-center justify-center`}>
                                <AlignLeft size={13} />
                            </button>
                        </div>

                        <button
                            onClick={() => onChange(DEFAULT_TYPOGRAPHY)}
                            className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white transition-colors">
                            <RotateCcw size={10} />
                            {t.typography.reset}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
