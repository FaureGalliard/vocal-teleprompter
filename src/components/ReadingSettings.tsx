import { Hourglass, MoveVertical, ScanLine, Timer } from 'lucide-react'
import { useT } from '../i18n'
import type { Settings } from '../hooks/useSettings'
import Switch from './Switch'
import { Row, selectClass } from './SettingsRows'

const COUNTDOWN_OPTIONS = [0, 3, 5, 10]

// The Reading section of the settings: how the script scrolls, the reading
// line, the countdown and the target duration
export default function ReadingSettings({ settings }: { settings: Settings }) {
    const {
        scrolling,
        setScrolling: onScrollingChange,
        readingLine,
        countdownSeconds,
        setCountdownSeconds: onCountdownSecondsChange,
        targetMinutes,
        setTargetMinutes: onTargetMinutesChange,
    } = settings
    const onToggleReadingLine = () => settings.setReadingLine((v) => !v)
    const t = useT()
    return (
        <>
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
                                onScrollingChange({
                                    ...scrolling,
                                    anchor: Number(e.target.value),
                                })
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
                    className={selectClass}>
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
                            onTargetMinutesChange(isNaN(val) ? 0 : Math.max(0, Math.min(180, val)))
                        }}
                        className="w-8 text-[11px] text-white bg-transparent text-right focus:outline-none"
                    />
                    <span className="text-[10px] text-white/40">min</span>
                </div>
            </Row>
        </>
    )
}
