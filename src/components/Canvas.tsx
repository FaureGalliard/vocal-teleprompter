import { useRef, useEffect } from 'react'

interface CanvasProps {
    scriptWords: string[]
    currentWordIndex: number
    fontSize: number
    textColor: string
    paddingTop: number
    paddingBottom: number
}

export default function Canvas({
    scriptWords,
    currentWordIndex,
    fontSize,
    textColor,
    paddingTop,
    paddingBottom,
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

    return (
        <div
            className="overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop,
                paddingBottom,
                boxSizing: 'border-box',
            }}>
            <div className="min-h-full flex items-start justify-center p-12">
                {scriptWords.length > 0 ? (
                    <p
                        className="text-center leading-relaxed w-full"
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
                        className="text-5xl text-center opacity-15"
                        style={{ color: textColor }}>
                        Tu texto aparecerá aquí
                    </p>
                )}
            </div>
        </div>
    )
}
