import { useEffect, useRef, useState } from 'react'
import {
    currentMonitor,
    getCurrentWindow,
    LogicalPosition,
    LogicalSize,
} from '@tauri-apps/api/window'

// Height of the toolbar plus a little air around it
export const BAR_ROOM = 56
// Extra room past the toolbar for its menus and panels
const PANEL_ROOM = 440

export interface Expansion {
    // Size of the teleprompter itself, which stays put while the window grows
    frame: { width: number; height: number }
    // Where the toolbar sits, outside the frame
    side: 'below' | 'above'
    // Height the window grew by
    room: number
}

interface State {
    expansion: Expansion | null
    // The window is done making room, so the toolbar can show without
    // jumping from the fallback spot to the room made for it
    ready: boolean
}

// Lets the browser paint the pinned frame before the window changes size
const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

// While `open`, grows the window with a transparent area below the
// teleprompter (or above it, when the screen ends close below) so the
// toolbar and its panels sit outside the text instead of covering it or
// being cut off; shrinks it back when closed.
// The teleprompter is pinned to its size before the window grows and until
// it has shrunk back, so it never stretches over the extra room.
// `expansion` is null when the window cannot grow (maximized), so the
// toolbar falls back to sitting over the bottom of the text.
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
            if (cancelled) return

            // Below unless the screen ends sooner there than above
            const wanted = BAR_ROOM + PANEL_ROOM
            const area = monitor
                ? {
                      top: monitor.workArea.position.y / scale,
                      bottom: (monitor.workArea.position.y + monitor.workArea.size.height) / scale,
                  }
                : null
            const roomBelow = area ? area.bottom - position.y - size.height : wanted
            const roomAbove = area ? position.y - area.top : 0
            const side = roomBelow >= wanted || roomBelow >= roomAbove ? 'below' : 'above'
            const room = Math.min(wanted, Math.max(BAR_ROOM, side === 'below' ? roomBelow : roomAbove))
            const frame = { width: size.width, height: size.height }

            // Pin the frame where it is, then grow the window around it
            setState({ expansion: { frame, side: 'below', room }, ready: false })
            await nextPaint()
            await win.setResizable(false)
            await win.setSize(new LogicalSize(size.width, size.height + room))
            if (side === 'above') {
                // The window grew downwards; slide it up while the frame
                // moves down by the same amount
                setState({ expansion: { frame, side, room }, ready: false })
                await win.setPosition(new LogicalPosition(position.x, position.y - room))
            }
            if (!cancelled) setState({ expansion: { frame, side, room }, ready: true })

            restoreRef.current = async () => {
                if (side === 'above') {
                    // Relative to where the window is now, in case it was dragged
                    const now = (await win.outerPosition()).toLogical(await win.scaleFactor())
                    setState({ expansion: { frame, side: 'below', room }, ready: false })
                    await win.setPosition(new LogicalPosition(now.x, now.y + room))
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
