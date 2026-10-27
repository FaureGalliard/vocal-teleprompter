import { useRef, useEffect } from 'react'
import type { Segment } from '../lib/segment'
import type { Card } from '../lib/cards'
import { useT } from '../i18n'

interface CanvasProps {
    cards: Card[]
    // Card holding the next word to read
    currentCard: number
    currentWordIndex: number
    onWordClick: (index: number) => void
    content: string
    isEditing: boolean
    onContentChange: (text: string) => void
    onEditStart: () => void
    onEditEnd: () => void
    fontSize: number
    textColor: string
    // Outline color that keeps text readable over an unknown backdrop
    textHalo?: string
    titleBarHeight: number
    titleBarPosition: 'top' | 'bottom'
}

export default function Canvas({
    cards,
    currentCard,
    currentWordIndex,
    onWordClick,
    content,
    isEditing,
    onContentChange,
    onEditStart,
    onEditEnd,
    fontSize,
    textColor,
    textHalo,
    titleBarHeight,
    titleBarPosition,
}: CanvasProps) {
    const t = useT()
    const containerRef = useRef<HTMLDivElement>(null)
    const activeWordRef = useRef<HTMLSpanElement>(null)

    // Scroll the canvas itself, vertically only. scrollIntoView also moves
    // every ancestor on both axes, which could push the script sideways out
    // of view.
    useEffect(() => {
        const container = containerRef.current
        const word = activeWordRef.current
        if (!container || !word) return
        container.scrollTo({
            top: word.offsetTop - (container.clientHeight - word.offsetHeight) / 2,
            left: 0,
            behavior: 'smooth',
        })
    }, [currentWordIndex])

    let prevWord = -1
    const textShadow = textHalo
        ? `0 0 2px ${textHalo}, 0 0 4px ${textHalo}, 0 0 1px ${textHalo}`
        : undefined
    const renderSegment = (segment: Segment, s: number) => {
        const i = segment.word
        if (i === -1) {
            // Gaps and punctuation follow the word before them
            return (
                <span
                    key={s}
                    style={{
                        color:
                            prevWord < currentWordIndex
                                ? `${textColor}50`
                                : textColor,
                        backgroundColor:
                            prevWord >= currentWordIndex &&
                            prevWord < currentWordIndex + 8
                                ? `${textColor}10`
                                : 'transparent',
                    }}>
                    {segment.text}
                </span>
            )
        }
        prevWord = i
        const isCurrentWord = i === currentWordIndex
        const isPast = i < currentWordIndex
        const isNearby =
            i > currentWordIndex && i <= currentWordIndex + 8

        return (
            <span
                key={s}
                ref={isCurrentWord ? activeWordRef : null}
                onClick={() => onWordClick(i)}
                className="cursor-pointer"
                style={{
                    color: isCurrentWord
                        ? '#1a1a1a'
                        : isPast
                          ? `${textColor}50`
                          : textColor,
                    backgroundColor: isCurrentWord
                        ? '#facc15'
                        : isNearby
                          ? `${textColor}10`
                          : 'transparent',
                    borderRadius: isCurrentWord ? '2px' : undefined,
                    // The highlight already has its own background
                    textShadow: isCurrentWord ? 'none' : undefined,
                    padding: isCurrentWord ? '0 2px' : undefined,
                    transition:
                        'color 0.2s ease, background-color 0.2s ease',
                }}>
                {segment.text}
            </span>
        )
    }

    const top = titleBarPosition === 'top' ? titleBarHeight + 15 : 20
    // Leave room for the status bar along the bottom edge
    const bottom = titleBarPosition === 'bottom' ? titleBarHeight + 34 : 36

    return (
        <div
            ref={containerRef}
            data-tour="canvas"
            style={
                {
                    position: 'fixed',
                    top,
                    bottom,
                    left: 20,
                    right: 20,
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                } as React.CSSProperties
            }
            className="[&::-webkit-scrollbar]:hidden">
            <div className="min-h-full">
                {isEditing ? (
                    <>
                        <p
                            className="text-center text-[11px] mb-3 opacity-50"
                            style={{ color: textColor }}>
                            {t.cards.hint}
                        </p>
                        <textarea
                            autoFocus
                            value={content}
                            onChange={(e) => onContentChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') onEditEnd()
                            }}
                            placeholder={t.canvas.editPlaceholder}
                            spellCheck={false}
                            className="block w-full min-h-[80%] text-center leading-relaxed bg-transparent resize-none outline-none placeholder:opacity-40"
                            style={
                                {
                                    fontSize: `${fontSize}px`,
                                    color: textColor,
                                    caretColor: textColor,
                                    textShadow,
                                    // Grow with the text so the canvas scrolls, not the field
                                    fieldSizing: 'content',
                                } as React.CSSProperties
                            }
                        />
                    </>
                ) : cards.some((c) => c.segments.length > 0) ? (
                    cards.map((card, c) => (
                        <section
                            key={c}
                            className={cards.length > 1 ? 'mb-10' : undefined}
                            style={{
                                // Other slides fade back so the current one stands out
                                opacity: cards.length > 1 && c !== currentCard ? 0.45 : 1,
                                transition: 'opacity 0.3s ease',
                            }}>
                            {cards.length > 1 && (
                                <div
                                    className="text-center text-[10px] font-medium uppercase tracking-widest mb-2"
                                    style={{ color: `${textColor}80` }}>
                                    {t.cards.label(c + 1)}
                                </div>
                            )}
                            <p
                                className="text-center leading-relaxed"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    whiteSpace: 'pre-wrap',
                                    // Long unbroken strings (URLs) wrap instead of widening the line
                                    overflowWrap: 'anywhere',
                                    textShadow,
                                }}>
                                {card.segments.map(renderSegment)}
                            </p>
                        </section>
                    ))
                ) : (
                    <p
                        onClick={onEditStart}
                        className="text-5xl text-center opacity-65 cursor-text"
                        style={{ color: textColor, textShadow }}>
                        {t.canvas.placeholder}
                    </p>
                )}
            </div>
        </div>
    )
}
