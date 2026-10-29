import { useEffect, useRef, useState, type RefObject } from 'react'
import { colorMap } from '../lib/backdrop'
import type { Seen } from './useBackdropView'

// A picture of the text color for every point of the window, and where each
// piece of text sits on it (by its `data-at` offset), so the text can be
// painted from it
export interface BackdropPaint {
    url: string
    width: number
    height: number
    offsets: Map<number, [number, number]>
}

// Where every piece of text in view sits, in CSS pixels from the window's corner
function measure(root: HTMLElement) {
    const view = root.getBoundingClientRect()
    const pieces: { at: number; left: number; top: number; right: number; bottom: number }[] = []
    for (const span of root.querySelectorAll<HTMLElement>('[data-at]')) {
        const { left, top, right, bottom } = span.getBoundingClientRect()
        if (bottom < view.top || top > view.bottom) continue
        pieces.push({ at: Number(span.dataset.at), left, top, right, bottom })
    }
    return pieces
}

// Turns each new look at the backdrop into a color map for the text in
// `container`: estimated background, eased in over time, then the readable
// color for every point of it
export function useBackdropPaint(
    container: RefObject<HTMLElement | null>,
    seen: Seen | null,
    // Used over gray areas, which have no hue to work from
    textColor: string,
): BackdropPaint | null {
    const [paint, setPaint] = useState<BackdropPaint | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const root = container.current
        if (!seen || !root) {
            setPaint(null)
            return
        }
        const { cols, rows, step } = seen
        const scale = window.devicePixelRatio
        const pieces = measure(root)

        const canvas = (canvasRef.current ??= document.createElement('canvas'))
        canvas.width = cols
        canvas.height = rows
        canvas
            .getContext('2d')!
            .putImageData(
                new ImageData(colorMap(seen.rgb, cols, rows, textColor), cols, rows),
                0,
                0,
            )
        setPaint({
            url: canvas.toDataURL(),
            width: cols * (step / scale),
            height: rows * (step / scale),
            offsets: new Map(pieces.map((p) => [p.at, [p.left, p.top]])),
        })
        // A new capture is what triggers a new look
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seen])

    // Text moves while scrolling: keep each piece lined up with the map
    useEffect(() => {
        const root = container.current
        if (!root || !paint) return
        let frame = 0
        const onScroll = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() =>
                setPaint(
                    (p) =>
                        p && {
                            ...p,
                            offsets: new Map(measure(root).map((m) => [m.at, [m.left, m.top]])),
                        },
                ),
            )
        }
        root.addEventListener('scroll', onScroll)
        return () => {
            cancelAnimationFrame(frame)
            root.removeEventListener('scroll', onScroll)
        }
    }, [container, paint !== null]) // eslint-disable-line react-hooks/exhaustive-deps

    return paint
}
