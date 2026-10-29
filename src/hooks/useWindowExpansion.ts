import { useEffect, useRef, useState } from 'react'
import {
    currentMonitor,
    getCurrentWindow,
    LogicalPosition,
    LogicalSize,
} from '@tauri-apps/api/window'

// Room the toolbar needs beside the teleprompter
export const TOOLBAR_GUTTER = 60
// Height the window grows to while the toolbar is open, so the toolbar and
// its panels fit even when the teleprompter is a thin strip
const OPEN_HEIGHT = 720

export interface Expansion {
    // Size of the teleprompter itself, which stays put while the window grows
    frame: { width: number; height: number }
    // Which side the toolbar sits on, outside the frame
    side: 'left' | 'right'
}

interface State {
    expansion: Expansion | null
    // The window is done making room, so the toolbar can show without
    // jumping from the fallback spot to the room made for it
    ready: boolean
}

// Lets the browser paint the pinned frame before the window changes size
const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

// While `open`, grows the window with a transparent area beside (and below)
// the teleprompter so the toolbar and its panels sit outside the text
// instead of covering it or being cut off; shrinks it back when closed.
// The teleprompter is pinned to its size before the window grows and until
// it has shrunk back, so it never stretches over the extra room.
// `expansion` is null when the window cannot grow (maximized), so the
// toolbar falls back to sitting over the text.
export function useWindowExpansion(open: boolean) {
    const [state, setState] = useState<State>({ expansion: null, ready: false })
    const restoreRef = useRef<(() => Promise<void>) | null>(null)
    // The last restore, which a new grow waits for so it measures the
    // window at its own size
    const settledRef = useRef<Promise<void>>(Promise.resolve())

    useEffect(() => {
        if (!open) return
        let cancelled = false
        const win = getCurrentWindow()

        const grow = async () => {
            await settledRef.current
            if (cancelled) return
            if (await win.isMaximized()) {
                if (!cancelled) setState({ expansion: null, ready: true })
                return
            }
            const scale = await win.scaleFactor()
            const size = (await win.innerSize()).toLogical(scale)
            const position = (await win.outerPosition()).toLogical(scale)
            const monitor = await currentMonitor()
            const area = monitor
                ? {
                      x: monitor.workArea.position.x / scale,
                      y: monitor.workArea.position.y / scale,
                      width: monitor.workArea.size.width / scale,
                      height: monitor.workArea.size.height / scale,
                  }
                : null
            if (cancelled) return

            // Grow to the right when there is room on that side of the screen
            const roomRight = !area || position.x + size.width + TOOLBAR_GUTTER <= area.x + area.width
            const side = roomRight ? 'right' : 'left'
            const bottomLimit = area ? area.y + area.height - position.y : OPEN_HEIGHT
            const height = Math.max(size.height, Math.min(OPEN_HEIGHT, bottomLimit))
            const frame = { width: size.width, height: size.height }

            // Pin the frame where it is, then grow the window around it
            setState({ expansion: { frame, side: 'right' }, ready: false })
            await nextPaint()
            await win.setResizable(false)
            await win.setSize(new LogicalSize(size.width + TOOLBAR_GUTTER, height))
            if (side === 'left') {
                // The window grew to the right; slide it left while the
                // frame moves right by the same amount
                setState({ expansion: { frame, side }, ready: false })
                await win.setPosition(new LogicalPosition(position.x - TOOLBAR_GUTTER, position.y))
            }
            if (!cancelled) setState({ expansion: { frame, side }, ready: true })

            restoreRef.current = async () => {
                if (side === 'left') {
                    // Relative to where the window is now, in case it was dragged
                    const now = (await win.outerPosition()).toLogical(await win.scaleFactor())
                    setState({ expansion: { frame, side: 'right' }, ready: false })
                    await win.setPosition(new LogicalPosition(now.x + TOOLBAR_GUTTER, now.y))
                }
                await win.setSize(new LogicalSize(size.width, size.height))
                await win.setResizable(true)
            }
        }
        const growing = grow().catch((e) => console.error('Could not make room for the toolbar:', e))

        return () => {
            cancelled = true
            setState((s) => ({ ...s, ready: false }))
            // Wait for a grow still in progress, undo it, and only then let
            // the frame fill the window again
            settledRef.current = growing
                .then(() => {
                    const restore = restoreRef.current
                    restoreRef.current = null
                    return restore?.()
                })
                .catch((e) => console.error('Could not restore the window:', e))
                .then(() => setState({ expansion: null, ready: false }))
        }
    }, [open])

    return state
}
