import { useEffect, useRef, useState, type RefObject } from 'react'
import {
    blur,
    colorMap,
    estimateBackground,
    settle,
    type Background,
    type Backdrop,
    type Surface,
} from '../lib/backdrop'

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
    backdrop: Backdrop | null,
    surface: Surface,
    // Used over gray areas, which have no hue to work from
    textColor: string,
): BackdropPaint | null {
    const [paint, setPaint] = useState<BackdropPaint | null>(null)
    const backgroundRef = useRef<Background | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const root = container.current
        if (!backdrop || !root) {
            backgroundRef.current = null
            setPaint(null)
            return
        }
        const { cols, rows, step } = backdrop
        const scale = window.devicePixelRatio
        const cell = (v: number) => (v * scale) / step
        const pieces = measure(root)

        // Our own letters, to leave out of a capture that includes the window
        let letters: Uint8Array | null = null
        if (!surface.hiddenFromCapture) {
            letters = new Uint8Array(cols * rows)
            for (const p of pieces) {
                const [c0, c1] = [Math.floor(cell(p.left)), Math.ceil(cell(p.right))]
                const [r0, r1] = [Math.floor(cell(p.top)), Math.ceil(cell(p.bottom))]
                for (let r = Math.max(0, r0); r < Math.min(rows, r1); r++)
                    letters.fill(1, r * cols + Math.max(0, c0), r * cols + Math.min(cols, c1))
            }
        }
        const background = settle(
            backgroundRef.current,
            blur(estimateBackground(backdrop, surface, letters), cols, rows),
        )
        backgroundRef.current = background

        const canvas = (canvasRef.current ??= document.createElement('canvas'))
        canvas.width = cols
        canvas.height = rows
        canvas
            .getContext('2d')!
            .putImageData(
                new ImageData(colorMap(background, cols, rows, textColor), cols, rows),
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
    }, [backdrop])

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
