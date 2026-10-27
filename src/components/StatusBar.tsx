import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '../i18n'

interface StatusBarProps {
    bottom: number
    cardCount: number
    currentCard: number
    onPreviousCard: () => void
    onNextCard: () => void
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
}: StatusBarProps) {
    const t = useT()

    return (
        <div
            className="fixed left-3 right-3 z-30 flex items-center justify-between pointer-events-none opacity-70 hover:opacity-100 transition-opacity"
            style={{ bottom }}>
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
    )
}
