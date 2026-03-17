import { useRef, useEffect } from 'react'

interface CanvasProps {
    scriptWords: string[]
    currentWordIndex: number
    fontSize: number
    textColor: string
    titleBarHeight: number
    titleBarPosition: 'top' | 'bottom'
}

export default function Canvas({
    scriptWords,
    currentWordIndex,
    fontSize,
    textColor,
    titleBarHeight,
    titleBarPosition,
}: CanvasProps) {
    const activeWordRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (activeWordRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [currentWordIndex])

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
            <div>
                {scriptWords.length > 0 ? (
                    <p
                        className="text-center leading-relaxed"
                        style={{ fontSize: `${fontSize}px` }}>
                        {scriptWords.map((word, i) => {
                            const isCurrentWord = i === currentWordIndex
                            const isPast = i < currentWordIndex
                            const isNearby =
                                i > currentWordIndex && i <= currentWordIndex + 8

                            return (
                                <span
                                    key={i}
                                    ref={isCurrentWord ? activeWordRef : null}
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
                                        padding: isCurrentWord ? '0 2px' : undefined,
                                        transition:
                                            'color 0.2s ease, background-color 0.2s ease',
                                    }}>
                                    {word}{' '}
                                </span>
                            )
                        })}
                    </p>
                ) : (
                    <p
                        className="text-5xl text-center opacity-65"
                        style={{ color: textColor }}>
                        Tu texto aparecerá aquí
                    </p>
                )}
            </div>
        </div>
    )
}
