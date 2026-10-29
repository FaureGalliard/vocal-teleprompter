import { useRef, useEffect } from 'react'
import type { Card, CardSegment } from '../lib/cards'
import { FONTS, type Typography } from '../lib/typography'
import type { Scrolling } from '../lib/scrolling'
import { useFollowWord } from '../hooks/useFollowWord'
import ReadingLine from './ReadingLine'
import type { Seen } from '../hooks/useBackdropView'
import { paintFrom } from '../lib/wordPaint'
import { useBackdropPaint } from '../hooks/useBackdropPaint'

// How many of the words already read keep nearly full strength
const RECENT_WORDS = 15
import { useT } from '../i18n'

interface CanvasProps {
    cards: Card[]
    // Card holding the next word to read
    currentCard: number
    // Current word reached by voice (highlighted) rather than placed by hand
    heard: boolean
    currentWordIndex: number
    // Click on a word: continue reading from it
    onContinueFrom: (index: number) => void
    // Click again on that word, or on a gap, while stopped: edit the script
    // with the caret at that spot
    onEditAt: (offset: number) => void
    isListening: boolean
    // Where to put the caret when editing starts
    editCaret: number | null
    content: string
    isEditing: boolean
    onContentChange: (text: string) => void
    onEditStart: () => void
    onEditEnd: () => void
    fontSize: number
    textColor: string
    // What is behind a see-through window, to color each word so it reads
    // well over it; null when the background is solid or it can't be seen
    seen: Seen | null
    // Hold the current line at a fixed height, near a top-mounted camera
    readingLine: boolean
    scrolling: Scrolling
    typography: Typography
    titleBarHeight: number
    // Room kept free at the bottom for the toolbar, when it sits over the text
    bottomInset: number
    titleBarPosition: 'top' | 'bottom'
}

export default function Canvas({
    cards,
    currentCard,
    heard,
    currentWordIndex,
    onContinueFrom,
    onEditAt,
    isListening,
    editCaret,
    content,
    isEditing,
    onContentChange,
    onEditStart,
    onEditEnd,
    fontSize,
    textColor,
    seen,
    readingLine,
    scrolling,
    typography,
    titleBarHeight,
    bottomInset,
    titleBarPosition,
}: CanvasProps) {
    const t = useT()
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const activeWordRef = useRef<HTMLSpanElement>(null)
    // The word after a heard one, kept in view too
    const nextWordRef = useRef<HTMLSpanElement>(null)
    const paint = useBackdropPaint(containerRef, isEditing ? null : seen, textColor)

    useEffect(() => {
        const editor = editorRef.current
        const container = containerRef.current
        if (!isEditing || !editor || !container) return
        const caret = editCaret ?? content.length
        editor.focus({ preventScroll: true })
        editor.setSelectionRange(caret, caret)
        // Bring the caret's line into view, roughly by its share of the text
        const share = content.length ? caret / content.length : 0
        container.scrollTop = share * editor.scrollHeight - container.clientHeight / 2
        // Only when editing starts, not on every keystroke
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    useFollowWord({
        container: containerRef,
        word: activeWordRef,
        next: nextWordRef,
        scrolling,
        lineHeight: fontSize * typography.lineHeight,
        position: `${currentWordIndex}:${heard}`,
    })

    let prevWord = -1
    // Words just read stay almost as bright, so the speaker can glance back
    // (or find their place if the marker ran ahead); older ones fade, less so
    // over a see-through background, where faint text gets lost
    const [recent, older] = paint ? [0.95, 0.7] : [0.85, 0.45]
    const fadeOf = (word: number, past: boolean) =>
        !past ? 1 : currentWordIndex - word <= RECENT_WORDS ? recent : older
    // Painted from the backdrop's color map when there is one, else plain
    const look = (at: number, fade: number) =>
        paintFrom(paint, at, fade) ?? { color: textColor, opacity: fade }
    // The reading line marks where fixed scrolling holds the current line
    const showReadingLine = readingLine && scrolling.mode === 'fixed'
    const readingLineAt = scrolling.anchor
    // Shared by the prompter text and the editor so editing looks the same
    const textStyle: React.CSSProperties = {
        fontFamily: FONTS[typography.font],
        fontWeight: typography.weight,
        lineHeight: typography.lineHeight,
        textAlign: typography.align,
        maxWidth: `${typography.width}%`,
        marginLeft: 'auto',
        marginRight: 'auto',
    }
    const renderSegment = (segment: CardSegment, s: number) => {
        const i = segment.word
        if (i === -1) {
            // Gaps and punctuation follow the word before them
            return (
                <span
                    key={s}
                    data-at={segment.offset}
                    onClick={isListening ? undefined : () => onEditAt(segment.offset)}
                    className={isListening ? undefined : 'cursor-text'}
                    style={{
                        ...look(segment.offset, fadeOf(prevWord, prevWord < currentWordIndex)),
                        backgroundColor:
                            prevWord >= currentWordIndex && prevWord < currentWordIndex + 8
                                ? `${textColor}10`
                                : 'transparent',
                    }}>
                    {segment.text}
                </span>
            )
        }
        prevWord = i
        // Only a word actually heard gets the highlight; after a manual move
        // the next word to read is just underlined
        const isCurrentWord = heard && i === currentWordIndex
        const isNextWord = !heard && i === currentWordIndex + 1
        const isPast = i < currentWordIndex || (!heard && i === currentWordIndex)
        const isNearby = i > currentWordIndex && i <= currentWordIndex + 8
        // The word reading continues from; clicking it again edits there
        const editsOnClick = !isListening && i === currentWordIndex + 1

        return (
            <span
                key={s}
                ref={
                    isCurrentWord || isNextWord
                        ? activeWordRef
                        : heard && i === currentWordIndex + 1
                          ? nextWordRef
                          : null
                }
                data-at={segment.offset}
                onClick={() => (editsOnClick ? onEditAt(segment.offset) : onContinueFrom(i))}
                className={editsOnClick ? 'cursor-text' : 'cursor-pointer'}
                style={{
                    ...(isCurrentWord
                        ? { color: '#1a1a1a' }
                        : look(segment.offset, fadeOf(i, isPast))),
                    backgroundColor: isCurrentWord
                        ? '#facc15'
                        : isNearby
                          ? `${textColor}10`
                          : 'transparent',
                    borderRadius: isCurrentWord ? '2px' : undefined,
                    padding: isCurrentWord ? '0 2px' : undefined,
                    textDecoration: isNextWord ? 'underline' : undefined,
                    // Painted text has no color of its own for the line to take
                    textDecorationColor: paint ? '#facc15' : undefined,
                    textDecorationThickness: isNextWord ? '2px' : undefined,
                    textUnderlineOffset: isNextWord ? '0.25em' : undefined,
                    transition: 'color 0.2s ease, background-color 0.2s ease',
                }}>
                {segment.text}
            </span>
        )
    }

    const top = titleBarPosition === 'top' ? titleBarHeight + 20 : 20
    // Leave room for the status bar along the bottom edge
    const bottom = titleBarPosition === 'bottom' ? titleBarHeight + 36 : 36

    return (
        <>
            <div
                ref={containerRef}
                data-tour="canvas"
                style={
                    {
                        position: 'fixed',
                        top,
                        bottom: bottom + bottomInset,
                        left: 20,
                        right: 20,
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        // Fade the text away from the reading line
                        maskImage: showReadingLine
                            ? `linear-gradient(to bottom, rgb(0 0 0 / 0.2), #000 ${readingLineAt * 60}%, #000 ${readingLineAt * 140}%, rgb(0 0 0 / 0.2))`
                            : undefined,
                    } as React.CSSProperties
                }
                className="[&::-webkit-scrollbar]:hidden">
                <div
                    className="min-h-full"
                    // A click off the words (beside or below the text) edits
                    onClick={(e) => {
                        if (
                            isEditing ||
                            isListening ||
                            (e.target as HTMLElement).tagName === 'SPAN'
                        )
                            return
                        onEditStart()
                    }}
                    // Start the text on the reading line and leave room to bring
                    // the last lines up to it
                    style={
                        showReadingLine
                            ? {
                                  paddingTop: `calc((var(--frame-h) - ${top + bottom}px) * ${readingLineAt} - ${fontSize}px)`,
                                  paddingBottom: 'calc(var(--frame-h) * 0.6)',
                              }
                            : undefined
                    }>
                    {isEditing ? (
                        <>
                            <textarea
                                ref={editorRef}
                                value={content}
                                onChange={(e) => onContentChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') onEditEnd()
                                }}
                                placeholder={t.canvas.editPlaceholder}
                                spellCheck={false}
                                className="block w-full min-h-[80%] bg-transparent resize-none outline-none placeholder:opacity-40"
                                style={
                                    {
                                        ...textStyle,
                                        fontSize: `${fontSize}px`,
                                        color: textColor,
                                        caretColor: textColor,
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
                                // A thin line between slides, which the status row
                                // already numbers, so the next one starts close by
                                className={c < cards.length - 1 ? 'pb-3 mb-3' : undefined}
                                style={{
                                    borderBottom:
                                        c < cards.length - 1
                                            ? `1px dashed ${textColor}40`
                                            : undefined,
                                    // Other slides fade back so the current one stands out
                                    opacity: cards.length > 1 && c !== currentCard ? 0.45 : 1,
                                    transition: 'opacity 0.3s ease',
                                }}>
                                <p
                                    // Clicking words moves the position; don't select text too
                                    className="select-none"
                                    style={{
                                        ...textStyle,
                                        fontSize: `${fontSize}px`,
                                        whiteSpace: 'pre-wrap',
                                        // Long unbroken strings (URLs) wrap instead of widening the line
                                        overflowWrap: 'anywhere',
                                    }}>
                                    {card.segments.map(renderSegment)}
                                </p>
                            </section>
                        ))
                    ) : (
                        <p
                            className="text-5xl text-center opacity-65 cursor-text"
                            style={{ color: textColor }}>
                            {t.canvas.placeholder}
                        </p>
                    )}
                </div>
            </div>
            {isEditing && (
                // In the status row (hidden while editing), so the text does
                // not shift down when editing starts
                <p
                    className="fixed left-3 h-6 flex items-center justify-center text-[11px] opacity-50 pointer-events-none truncate"
                    style={{
                        bottom: (titleBarPosition === 'bottom' ? titleBarHeight : 0) + 6,
                        right: 44,
                        color: textColor,
                    }}>
                    {t.cards.hint}
                </p>
            )}
            {showReadingLine && !isEditing && (
                <ReadingLine
                    top={top}
                    bottom={bottom}
                    at={readingLineAt}
                    height={fontSize * typography.lineHeight + 8}
                    color={textColor}
                />
            )}
        </>
    )
}
