import { useCallback, useEffect, useRef, useState } from 'react'
import {
    currentMonitor,
    getCurrentWindow,
    LogicalPosition,
    LogicalSize,
} from '@tauri-apps/api/window'
import { whenPlaced } from './useWindowPlacement'

// Height of the toolbar plus a little air around it
export const BAR_ROOM = 56
// Extra room past the toolbar for its menus and panels
const PANEL_ROOM = 440

export interface Expansion {
    // Size of the teleprompter itself, which stays put while the window grows
    frame: { width: number; height: number }
    // Height the window grew by, below the frame
    room: number
}

interface State {
    expansion: Expansion | null
    // The window is done making room, so the toolbar can show without
    // jumping from the fallback spot to the room made for it
    ready: boolean
}

// Lets the browser paint the pinned frame before the window changes size
const nextPaint = () =>
    new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )

// While `open`, grows the window with a transparent area below the
// teleprompter so the toolbar and its panels sit outside the text instead of
// covering it or being cut off; shrinks it back when closed. The window
// never moves: near the bottom of the screen it grows only as far as the
// screen goes (the panels then scroll), and with no room even for the
// toolbar it falls back to the toolbar over the text. (Growing upwards
// needs the teleprompter to move inside the window at the same instant as
// the window moves, which can't be done, so everything jumped.)
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
    // Size of the teleprompter while the window is grown, which the restore
    // shrinks back to; it changes when the title bar is shown or hidden
    const frameRef = useRef<Expansion['frame'] | null>(null)

    useEffect(() => {
        if (!open) return
        let cancelled = false
        const win = getCurrentWindow()

        const grow = async () => {
            await whenPlaced()
            await settledRef.current
            if (cancelled) return
            const fallBack = () => {
                if (!cancelled) setState({ expansion: null, ready: true })
            }
            if (await win.isMaximized()) return fallBack()
            const scale = await win.scaleFactor()
            const size = (await win.innerSize()).toLogical(scale)
            const position = (await win.outerPosition()).toLogical(scale)
            const monitor = await currentMonitor()
            if (cancelled) return

            const wanted = BAR_ROOM + PANEL_ROOM
            const screenBottom = monitor
                ? (monitor.workArea.position.y + monitor.workArea.size.height) / scale
                : Infinity
            const room = Math.min(wanted, screenBottom - position.y - size.height)
            if (room < BAR_ROOM) return fallBack()
            const frame = { width: size.width, height: size.height }
            frameRef.current = frame

            // Pin the frame where it is, then grow the window around it
            setState({ expansion: { frame, room }, ready: false })
            await nextPaint()
            await win.setResizable(false)
            await win.setSize(new LogicalSize(size.width, size.height + room))
            if (!cancelled) setState({ expansion: { frame, room }, ready: true })

            restoreRef.current = async () => {
                const own = frameRef.current ?? frame
                frameRef.current = null
                await win.setSize(new LogicalSize(own.width, own.height))
                await win.setResizable(true)
            }
        }
        const growing = grow().catch((e) =>
            console.error('Could not make room for the toolbar:', e),
        )

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

    // Makes the teleprompter taller (or shorter, when negative) by `delta` at
    // one edge, moving the window so the rest of it stays put on screen
    const resizeFrame = useCallback(async (delta: number, edge: 'top' | 'bottom') => {
        const win = getCurrentWindow()
        if (await win.isMaximized()) return
        const scale = await win.scaleFactor()
        const position = (await win.outerPosition()).toLogical(scale)
        const size = (await win.innerSize()).toLogical(scale)
        const frame = frameRef.current
        if (frame) {
            const resized = { width: frame.width, height: frame.height + delta }
            frameRef.current = resized
            setState((s) =>
                s.expansion ? { ...s, expansion: { ...s.expansion, frame: resized } } : s,
            )
        }
        if (edge === 'top')
            await win.setPosition(new LogicalPosition(position.x, position.y - delta))
        await win.setSize(new LogicalSize(size.width, size.height + delta))
    }, [])

    return { ...state, resizeFrame }
}
