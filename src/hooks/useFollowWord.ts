import { useEffect, type RefObject } from 'react'
import { scrollTarget, type Scrolling } from '../lib/scrolling'

// Scrolls the canvas to keep the current word (and the next one, at the end
// of a paragraph or slide) where the scrolling mode wants it. Vertically
// only: scrollIntoView also moves every ancestor on both axes, which could
// push the script sideways out of view.
export function useFollowWord({
    container,
    word,
    next,
    scrolling,
    lineHeight,
    position,
}: {
    container: RefObject<HTMLElement | null>
    word: RefObject<HTMLElement | null>
    next: RefObject<HTMLElement | null>
    scrolling: Scrolling
    lineHeight: number
    // Changes whenever the reading position does
    position: unknown
}) {
    useEffect(() => {
        const box = container.current
        const current = word.current
        if (!box || !current) return
        const after = next.current
        const top = scrollTarget(
            scrolling,
            { top: box.scrollTop, height: box.clientHeight },
            { top: current.offsetTop, height: current.offsetHeight },
            lineHeight,
            after ? { top: after.offsetTop, height: after.offsetHeight } : undefined,
        )
        if (top !== null) box.scrollTo({ top, left: 0, behavior: 'smooth' })
    }, [container, word, next, scrolling, lineHeight, position])
}
