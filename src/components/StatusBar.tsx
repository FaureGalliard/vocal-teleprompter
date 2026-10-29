import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Mic, MousePointerClick, Timer } from 'lucide-react'
import { useT } from '../i18n'
import { formatDuration, type PaceStatus } from '../hooks/usePace'

interface StatusBarProps {
    bottom: number
    cardCount: number
    currentCard: number
    onPreviousCard: () => void
    onNextCard: () => void
    sessionActive: boolean
    elapsedMs: number
    wpm: number | null
    remainingMs: number
    estimatedMs: number
    targetMinutes: number
    status: PaceStatus | null
    clickThrough: boolean
    // What the recognizer heard last, while listening
    heard: string
    error: string | null
    // Seconds left before listening starts
    countdown: number | null
}

const STATUS_COLOR: Record<PaceStatus, string> = {
    'on-pace': '#4ade80',
    'speed-up': '#facc15',
    'slow-down': '#f87171',
}

const RADIUS = 6
const RING = 2 * Math.PI * RADIUS

const pill = 'flex items-center gap-1 h-6 px-1 rounded-full bg-[#1a1a1a]/80 text-white/70 text-[10px]'
const arrow =
    'flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors'

// Small overlay along the bottom edge with presentation info
export default function StatusBar({
    bottom,
    cardCount,
    currentCard,
    onPreviousCard,
    onNextCard,
    sessionActive,
    elapsedMs,
    wpm,
    remainingMs,
    estimatedMs,
    targetMinutes,
    status,
    clickThrough,
    heard,
    error,
    countdown,
}: StatusBarProps) {
    const t = useT()
    const target = targetMinutes > 0 ? formatDuration(targetMinutes * 60000) : null

    return (
        <>
            {countdown !== null && (
                // Centered in the row and in full color, so it is noticed
                // without covering the text
                <div
                    className="fixed left-1/2 -translate-x-1/2 z-30 h-6 flex items-center gap-1.5 text-[#7698fe] pointer-events-none"
                    style={{ bottom }}
                    title={t.settings.countdown}>
                    <svg
                        width={14}
                        height={14}
                        className="-rotate-90">
                        <circle
                            cx={7}
                            cy={7}
                            r={RADIUS}
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity={0.25}
                            strokeWidth={2}
                        />
                        <motion.circle
                            key={countdown}
                            cx={7}
                            cy={7}
                            r={RADIUS}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeDasharray={RING}
                            initial={{ strokeDashoffset: 0 }}
                            animate={{ strokeDashoffset: RING }}
                            transition={{ duration: 1, ease: 'linear' }}
                        />
                    </svg>
                    <span className="text-[14px] font-semibold tabular-nums">{countdown}</span>
                </div>
            )}
            <div
                className="fixed left-3 z-30 flex items-center justify-between gap-2 pointer-events-none opacity-70 hover:opacity-100 transition-opacity"
                // Leaves the corner to the toolbar button
                style={{ bottom, right: 44 }}>
                <div className="flex items-center gap-2">
                    {clickThrough && (
                        <div
                            className={`${pill} px-2.5 gap-1.5 text-[#facc15]`}
                            title={t.settings.clickThrough}>
                            <MousePointerClick size={11} />
                            {t.statusBar.clickThroughOn}
                        </div>
                    )}
                    {cardCount > 1 ? (
                        <div className={`${pill} pointer-events-auto`}>
                            <button
                                onClick={onPreviousCard}
                                disabled={currentCard === 0}
                                title={t.cards.previous}
                                className={arrow}>
                                <ChevronLeft size={12} />
                            </button>
                            <span className="px-1 tabular-nums">
                                {t.cards.position(currentCard + 1, cardCount)}
                            </span>
                            <button
                                onClick={onNextCard}
                                disabled={currentCard === cardCount - 1}
                                title={t.cards.next}
                                className={arrow}>
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    ) : (
                        <span />
                    )}
                </div>

                {error && (
                    <div className={`${pill} px-2.5 text-red-300 min-w-0 max-w-[40%]`}>
                        <span className="truncate">{error}</span>
                    </div>
                )}

                {heard && !error && (
                    <div
                        className={`${pill} px-2.5 gap-1.5 min-w-0 max-w-[40%]`}
                        title={t.mic.heard}>
                        <Mic
                            size={11}
                            className="flex-shrink-0 text-[#4ade80]"
                        />
                        {/* Last few words only, newest on the right */}
                        <span
                            className="truncate italic"
                            dir="rtl">
                            <bdi>{heard}</bdi>
                        </span>
                    </div>
                )}

                {estimatedMs > 0 && (
                    <div className={`${pill} px-2.5 gap-1.5 tabular-nums`}>
                        <Timer size={11} />
                        {sessionActive ? (
                            <>
                                <span className="text-white">
                                    {formatDuration(elapsedMs)}
                                    {target && ` / ${target}`}
                                </span>
                                {wpm !== null && <span>· {t.pace.wpm(Math.round(wpm))}</span>}
                                <span>· {t.pace.left(formatDuration(remainingMs))}</span>
                                {status && (
                                    <span
                                        className="flex items-center gap-1"
                                        style={{ color: STATUS_COLOR[status] }}>
                                        · <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {t.pace[status]}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span>
                                {t.pace.estimate(formatDuration(estimatedMs))}
                                {target && ` · ${t.pace.target(target)}`}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
