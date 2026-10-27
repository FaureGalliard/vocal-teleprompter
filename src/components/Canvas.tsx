import { useRef, useEffect } from 'react'
import type { Segment } from '../lib/segment'
import { useT } from '../i18n'

interface CanvasProps {
    segments: Segment[]
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
    segments,
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
    const activeWordRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (activeWordRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [currentWordIndex])

    let prevWord = -1
    const textShadow = textHalo
        ? `0 0 2px ${textHalo}, 0 0 4px ${textHalo}, 0 0 1px ${textHalo}`
        : undefined
    const top = titleBarPosition === 'top' ? titleBarHeight + 15 : 20
    const bottom = titleBarPosition === 'bottom' ? titleBarHeight + 20 : 30

    return (
        <div
            style={
                {
                    position: 'fixed',
                    top,
                    bottom,
                    left: 20,
                    right: 20,
                    overflowY: 'scroll',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                } as React.CSSProperties
            }
            className="[&::-webkit-scrollbar]:hidden">
            <div className="min-h-full">
                {isEditing ? (
                    <textarea
                        autoFocus
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onEditEnd()
                        }}
                        placeholder={t.canvas.editPlaceholder}
                        spellCheck={false}
                        className="block w-full min-h-full text-center leading-relaxed bg-transparent resize-none outline-none placeholder:opacity-40"
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
                ) : segments.length > 0 ? (
                    <p
                        className="text-center leading-relaxed"
                        style={{
                            fontSize: `${fontSize}px`,
                            whiteSpace: 'pre-wrap',
                            textShadow,
                        }}>
                        {segments.map((segment, s) => {
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
                        })}
                    </p>
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
