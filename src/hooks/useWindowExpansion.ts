import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import {
    currentMonitor,
    getCurrentWindow,
    LogicalPosition,
    LogicalSize,
} from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { whenPlaced } from './useWindowPlacement'
import { IS_LINUX } from '../lib/platform'
import { draggedHeight, inputRegion, keptWindowSize } from '../lib/keptRoom'

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
export function useWindowExpansion(open: boolean, clickThrough: boolean) {
    // Fixed for the whole run, so the same hooks are always called
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return IS_LINUX ? useKeptRoom(open, clickThrough) : useGrowingRoom(open)
}

function useGrowingRoom(open: boolean) {
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
            grownRoom = room
            await win.setResizable(false)
            await win.setSize(new LogicalSize(size.width, size.height + room))
            if (!cancelled) setState({ expansion: { frame, room }, ready: true })

            restoreRef.current = async () => {
                const own = frameRef.current ?? frame
                frameRef.current = null
                grownRoom = 0
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

    return { ...state, resizeFrame, dragBottom: null }
}

// The room kept below the teleprompter on Linux, 0 while there is none, so
// what is behind the window is only looked at behind the teleprompter
export let keptRoom = 0

// The room the window has grown by below the teleprompter elsewhere, 0
// while the toolbar is closed
let grownRoom = 0

// The room below the teleprompter, kept or grown, in CSS pixels
export const roomBelow = () => keptRoom || grownRoom

// Linux: growing the window takes a good part of a second there (every
// resize has the compositor and WebKit redo the whole surface), so the
// window keeps the room for the toolbar all the time, and opening the
// toolbar only shows it. That room takes no clicks unless the toolbar is
// open: they go through to what is behind, as if the window ended where
// the teleprompter does. The teleprompter is the window less that room, so
// it follows the window as the user resizes it by its edges.
function useKeptRoom(open: boolean, clickThrough: boolean) {
    const [expansion, setExpansion] = useState<Expansion | null>(null)
    const expansionRef = useRef(expansion)
    expansionRef.current = expansion
    const roomRef = useRef(0)

    useEffect(() => {
        let cancelled = false
        const win = getCurrentWindow()
        // The teleprompter is whatever the room leaves of the window
        const follow = () => {
            const room = roomRef.current
            if (!room || window.innerWidth <= 0 || window.innerHeight <= room) return
            const frame = { width: window.innerWidth, height: window.innerHeight - room }
            setExpansion((e) =>
                e && e.frame.width === frame.width && e.frame.height === frame.height
                    ? e
                    : { frame, room },
            )
        }
        const keep = async () => {
            await whenPlaced()
            if (cancelled || (await win.isMaximized())) return
            // The window's own size, as placed: the page in it may not have
            // one yet, as the window has only just been shown
            const frame = (await win.innerSize()).toLogical(await win.scaleFactor())
            const room = BAR_ROOM + PANEL_ROOM
            const grown = keptWindowSize(frame, room)
            if (cancelled || !grown) return
            // Pinned first, so the teleprompter does not stretch as the
            // window grows around it
            roomRef.current = room
            keptRoom = room
            setExpansion({ frame: { width: frame.width, height: frame.height }, room })
            await nextPaint()
            await win.setSize(new LogicalSize(grown.width, grown.height))
        }
        keep().catch((e) => console.error('Could not keep room for the toolbar:', e))
        window.addEventListener('resize', follow)
        return () => {
            cancelled = true
            window.removeEventListener('resize', follow)
        }
    }, [])

    // Clicks reach the teleprompter, and the room only while the toolbar is
    // in it; none at all in click-through mode
    useEffect(() => {
        const rects = inputRegion(expansion?.frame ?? null, open, clickThrough)
        invoke('set_input_region', { rects }).catch((e) =>
            console.error('Could not let clicks through:', e),
        )
    }, [expansion, open, clickThrough])

    // Taller or shorter by `delta` at one edge: the window changes by as
    // much, keeping its room, and the teleprompter follows it
    const resizeFrame = useCallback(async (delta: number, edge: 'top' | 'bottom') => {
        const win = getCurrentWindow()
        if (await win.isMaximized()) return
        const scale = await win.scaleFactor()
        if (edge === 'top') {
            const position = (await win.outerPosition()).toLogical(scale)
            await win.setPosition(new LogicalPosition(position.x, position.y - delta))
        }
        await win.setSize(new LogicalSize(window.innerWidth, window.innerHeight + delta))
    }, [])

    // The teleprompter's bottom edge is not the window's, which is further
    // down: while it is dragged the teleprompter takes from or gives back to
    // the room, and the window takes the new size once it is let go
    const dragBottom = useCallback((down: PointerEvent<HTMLElement>) => {
        const start = expansionRef.current
        if (!start || down.button !== 0) return
        down.preventDefault()
        const edge = down.currentTarget
        edge.setPointerCapture(down.pointerId)
        let height = start.frame.height
        const onMove = (e: globalThis.PointerEvent) => {
            height = draggedHeight(
                start.frame.height,
                e.clientY - down.clientY,
                window.innerHeight,
                BAR_ROOM,
            )
            setExpansion({
                frame: { width: start.frame.width, height },
                room: window.innerHeight - height,
            })
        }
        const onUp = () => {
            edge.removeEventListener('pointermove', onMove)
            edge.removeEventListener('pointerup', onUp)
            getCurrentWindow()
                .setSize(new LogicalSize(window.innerWidth, height + roomRef.current))
                .catch((e) => console.error('Could not resize the window:', e))
        }
        edge.addEventListener('pointermove', onMove)
        edge.addEventListener('pointerup', onUp)
    }, [])

    return { expansion, ready: true, resizeFrame, dragBottom }
}
