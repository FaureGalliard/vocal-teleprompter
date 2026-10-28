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
}

const STATUS_COLOR: Record<PaceStatus, string> = {
    'on-pace': '#4ade80',
    'speed-up': '#facc15',
    'slow-down': '#f87171',
}

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
}: StatusBarProps) {
    const t = useT()
    const target = targetMinutes > 0 ? formatDuration(targetMinutes * 60000) : null

    return (
        <div
            className="fixed left-3 right-3 z-30 flex items-center justify-between pointer-events-none opacity-70 hover:opacity-100 transition-opacity"
            style={{ bottom }}>
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

            {heard && (
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
    )
}
