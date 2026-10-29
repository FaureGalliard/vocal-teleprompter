import { useEffect, useRef, useState, type RefObject } from 'react'
import { wordColors, type Backdrop, type Surface } from '../lib/backdrop'

// Each word's color for the left and right halves of it
export type WordColors = Map<number, [string, string]>

// Picks a readable color for every word on screen from what is behind it,
// each time a new look at the backdrop comes in. Words are found by their
// `data-word` index inside `container`.
export function useWordColors(
    container: RefObject<HTMLElement | null>,
    backdrop: Backdrop | null,
    surface: Surface,
    textColor: string,
): WordColors | null {
    const [colors, setColors] = useState<WordColors | null>(null)
    const colorsRef = useRef(colors)
    colorsRef.current = colors

    useEffect(() => {
        const root = container.current
        if (!backdrop || !root) {
            setColors(null)
            return
        }
        const view = root.getBoundingClientRect()
        const scale = window.devicePixelRatio
        const next: WordColors = new Map()
        let changed = false
        for (const span of root.querySelectorAll<HTMLElement>('[data-word]')) {
            const rect = span.getBoundingClientRect()
            // Only the words in view
            if (rect.bottom < view.top || rect.top > view.bottom) continue
            const word = Number(span.dataset.word)
            const before = colorsRef.current?.get(word)
            const found = wordColors(
                backdrop,
                surface,
                rect,
                scale,
                textColor,
                before?.[0] ?? textColor,
            )
            const pair = found ?? before
            if (!pair) continue
            next.set(word, pair)
            if (!before || before[0] !== pair[0] || before[1] !== pair[1]) changed = true
        }
        // Re-render only when a color actually changed
        if (changed || next.size !== (colorsRef.current?.size ?? 0)) setColors(next)
        // A new capture is what triggers a new look
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backdrop])

    return colors
}
