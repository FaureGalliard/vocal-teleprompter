import { AlignCenter, AlignLeft, RotateCcw } from 'lucide-react'
import { useT } from '../i18n'
import { DEFAULT_TYPOGRAPHY, FONTS, type FontKey, type Typography } from '../lib/typography'

interface TypographyControlsProps {
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

export default function TypographyControls({
    value,
    onChange,
    onAdjustStart,
}: TypographyControlsProps) {
    const t = useT()
    const set = (patch: Partial<Typography>) => onChange({ ...value, ...patch })

    return (
        <>
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
        </>
    )
}
