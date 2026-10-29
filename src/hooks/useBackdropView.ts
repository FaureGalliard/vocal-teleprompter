import { useEffect, useRef, useState } from 'react'
import { blur, settle, type Background, type Backdrop, type Surface } from '../lib/backdrop'
import { rgb } from '../lib/backdrop'

// What the eye sees behind the text, sample by sample
export interface Seen {
    cols: number
    rows: number
    step: number
    rgb: Background
}

// The softened backdrop, drawn behind the text like frosted glass
export interface Glass {
    url: string
    width: number
    height: number
}

// Softening at 100%, in samples
const MAX_BLUR = 12

function picture(canvas: HTMLCanvasElement, grid: Background, cols: number, rows: number) {
    const image = new Uint8ClampedArray(cols * rows * 4)
    for (let i = 0; i < cols * rows; i++) {
        image.set([grid[i * 3], grid[i * 3 + 1], grid[i * 3 + 2], 255], i * 4)
    }
    canvas.width = cols
    canvas.height = rows
    canvas.getContext('2d')!.putImageData(new ImageData(image, cols, rows), 0, 0)
    return canvas.toDataURL()
}

// From each look at the backdrop: the frosted glass (the backdrop blurred by
// `soften`, 0-100) and what the eye then sees behind the text, with the
// window's own background over it, eased in over time so it doesn't flicker
export function useBackdropView(backdrop: Backdrop | null, surface: Surface, soften: number) {
    const [view, setView] = useState<{ seen: Seen; glass: Glass | null } | null>(null)
    const seenRef = useRef<Background | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (!backdrop) {
            seenRef.current = null
            setView(null)
            return
        }
        const { cols, rows, step, pixels } = backdrop
        const raw = Float32Array.from(pixels.subarray(0, cols * rows * 3))
        const radius = Math.round((soften / 100) * MAX_BLUR)
        const behind = radius ? blur(raw, cols, rows, radius) : raw
        const scale = window.devicePixelRatio
        const glass = radius
            ? {
                  url: picture(
                      (canvasRef.current ??= document.createElement('canvas')),
                      behind,
                      cols,
                      rows,
                  ),
                  width: cols * (step / scale),
                  height: rows * (step / scale),
              }
            : null

        const fill = rgb(surface.background)
        const a = surface.opacity
        const seen = behind.map((v, i) => a * fill[i % 3] + (1 - a) * v)
        seenRef.current = settle(seenRef.current, seen)
        setView({ seen: { cols, rows, step, rgb: seenRef.current }, glass })
        // A new capture is what triggers a new look
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backdrop])

    return view
}
