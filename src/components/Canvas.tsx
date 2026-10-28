import { useRef, useEffect } from 'react'
import type { Card, CardSegment } from '../lib/cards'
import { FONTS, type Typography } from '../lib/typography'
import { scrollTarget, type Scrolling } from '../lib/scrolling'
import { useT } from '../i18n'


interface CanvasProps {
    cards: Card[]
    // Card holding the next word to read
    currentCard: number
    // Current word reached by voice (highlighted) rather than placed by hand
    heard: boolean
    currentWordIndex: number
    // Ctrl+click, or any click while listening: continue reading from that word
    onContinueFrom: (index: number) => void
    // Plain click while stopped: edit the script with the caret at that spot
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
    // Outline color that keeps text readable over an unknown backdrop
    textHalo?: string
    // Hold the current line at a fixed height, near a top-mounted camera
    readingLine: boolean
    scrolling: Scrolling
    typography: Typography
    titleBarHeight: number
    // Room kept free on the right for the toolbar
    rightInset: number
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
    textHalo,
    readingLine,
    scrolling,
    typography,
    titleBarHeight,
    rightInset,
    titleBarPosition,
}: CanvasProps) {
    const t = useT()
    const containerRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const activeWordRef = useRef<HTMLSpanElement>(null)

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
    }, [isEditing])

    // Scroll the canvas itself, vertically only. scrollIntoView also moves
    // every ancestor on both axes, which could push the script sideways out
    // of view.
    useEffect(() => {
        const container = containerRef.current
        const word = activeWordRef.current
        if (!container || !word) return
        const top = scrollTarget(
            scrolling,
            { top: container.scrollTop, height: container.clientHeight },
            { top: word.offsetTop, height: word.offsetHeight },
            fontSize * typography.lineHeight,
        )
        if (top !== null) container.scrollTo({ top, left: 0, behavior: 'smooth' })
    }, [currentWordIndex, heard, scrolling, fontSize, typography.lineHeight])

    let prevWord = -1
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
    const textShadow = textHalo
        ? `0 0 2px ${textHalo}, 0 0 4px ${textHalo}, 0 0 1px ${textHalo}`
        : undefined
    const renderSegment = (segment: CardSegment, s: number) => {
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
        // Only a word actually heard gets the highlight; after a manual move
        // the next word to read is just underlined
        const isCurrentWord = heard && i === currentWordIndex
        const isNextWord = !heard && i === currentWordIndex + 1
        const isPast = i < currentWordIndex || (!heard && i === currentWordIndex)
        const isNearby =
            i > currentWordIndex && i <= currentWordIndex + 8

        return (
            <span
                key={s}
                ref={isCurrentWord || isNextWord ? activeWordRef : null}
                onClick={(e) =>
                    e.ctrlKey || e.metaKey || isListening
                        ? onContinueFrom(i)
                        : onEditAt(segment.offset)
                }
                className={isListening ? 'cursor-pointer' : 'cursor-text'}
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
                    textDecoration: isNextWord ? 'underline' : undefined,
                    textDecorationThickness: isNextWord ? '2px' : undefined,
                    textUnderlineOffset: isNextWord ? '0.25em' : undefined,
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
        <>
            <div
                ref={containerRef}
                data-tour="canvas"
                style={
                    {
                        position: 'fixed',
                        top,
                        bottom,
                        left: 20,
                        right: 20 + rightInset,
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
                    // Start the text on the reading line and leave room to bring
                    // the last lines up to it
                    style={
                        showReadingLine
                            ? {
                                  paddingTop: `calc((100vh - ${top + bottom}px) * ${readingLineAt} - ${fontSize}px)`,
                                  paddingBottom: '60vh',
                              }
                            : undefined
                    }>
                    {isEditing ? (
                        <>
                            <p
                                className="text-center text-[11px] mb-3 opacity-50"
                                style={{ color: textColor }}>
                                {t.cards.hint}
                            </p>
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
                                    // Clicking words moves the position; don't select text too
                                className="select-none"
                                    style={{
                                        ...textStyle,
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
            {showReadingLine && !isEditing && (
                <div
                    className="fixed pointer-events-none rounded-md"
                    style={{
                        left: 12,
                        right: 12,
                        top: `calc(${top}px + (100vh - ${top + bottom}px) * ${readingLineAt})`,
                        height: fontSize * typography.lineHeight + 8,
                        transform: 'translateY(-50%)',
                        backgroundColor: `${textColor}14`,
                        borderTop: `1px solid ${textColor}30`,
                        borderBottom: `1px solid ${textColor}30`,
                    }}
                />
            )}
        </>
    )
}
