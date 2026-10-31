import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { parseBackdrop, type Backdrop, type Place } from '../lib/backdrop'
import { IS_LINUX } from '../lib/platform'
import { keptRoom } from './useWindowExpansion'

// Physical pixels between samples: plenty for the color behind a letter
const STEP = 2
const EVERY_MS = 300
// While the window shows in screen captures the windows behind it paint
// themselves for each look, which costs them some work: look a bit less often
const SHOWN_EVERY_MS = 500
// The window counts as moving until it has held still this long
const STILL_MS = 150
// After something changed behind the window: it may still be changing (a
// slide transition), so look again soon to follow it
const CHANGED_MS = 120
// After a click, a key or the wheel anywhere: what most slide changes follow,
// so look right away instead of waiting for the next round
const INPUT_MS = 80
// On Linux GNOME Shell paints each look on the thread that draws the whole
// desktop, so looks are spaced out there: never closer than this, even
// while what is behind keeps changing (a video), and a steady one less often
const LINUX_GAP_MS = 400
const LINUX_EVERY_MS = 1000

// The teleprompter's own height in a window of `height` physical pixels,
// without the room kept below it for the toolbar on Linux
const frameHeight = (height: number) => {
    const room = Math.round(keptRoom * window.devicePixelRatio)
    return height > room ? height - room : height
}

// What is behind the window, while `enabled` (a see-through background).
// Hidden from screen capture, each look covers the whole monitor, so moving
// or resizing the window needs no new look: `place` says where it now is, to
// cut that part out. `shown` in screen captures, each look covers just the
// window, painted by the windows behind it so the prompter never blinks in a
// recording, and a move brings a new one. Looks come at a steady pace, right
// after a click or a key, and closely after a change (`hurry`).
export function useBackdrop(enabled: boolean, shown: boolean) {
    const [backdrop, setBackdrop] = useState<Backdrop | null>(null)
    const [place, setPlace] = useState<Place | null>(null)
    const [moving, setMoving] = useState(false)
    const hurryRef = useRef<(ms?: number) => void>(() => {})
    // Dragged, as the GNOME Shell extension tells: no looks until it stops
    const draggedRef = useRef(false)

    // Where the window is, kept up to date as it moves and resizes
    useEffect(() => {
        if (!enabled) return
        const win = getCurrentWindow()
        Promise.all([win.innerPosition(), win.innerSize()]).then(([p, s]) =>
            setPlace({ x: p.x, y: p.y, width: s.width, height: frameHeight(s.height) }),
        )
        let still: ReturnType<typeof setTimeout>
        const moved = win.onMoved(({ payload }) => {
            setPlace((p) => p && { ...p, x: payload.x, y: payload.y })
            setMoving(true)
            clearTimeout(still)
            still = setTimeout(() => setMoving(false), STILL_MS)
        })
        const resized = win.onResized(({ payload }) =>
            setPlace(
                (p) => p && { ...p, width: payload.width, height: frameHeight(payload.height) },
            ),
        )
        // Wayland tells no app that its window moves; the GNOME Shell
        // extension tells when a drag starts and ends instead. The window
        // only knows where it is again by looking, so it does not look while
        // dragged, and looks right away once let go.
        const dragged = listen<boolean>('window-moving', ({ payload }) => {
            clearTimeout(still)
            draggedRef.current = payload
            setMoving(payload)
            if (!payload) hurryRef.current(0)
        })
        return () => {
            clearTimeout(still)
            moved.then((off) => off())
            resized.then((off) => off())
            dragged.then((off) => off())
        }
    }, [enabled])

    useEffect(() => {
        if (!enabled) {
            setBackdrop(null)
            return
        }
        let stopped = false
        let busy = false
        // Asked for a look while one was underway: take the next one soon
        let soon = false
        let timer: ReturnType<typeof setTimeout>
        let lastLook = 0
        const next = (ms: number) => {
            clearTimeout(timer)
            if (IS_LINUX) ms = Math.max(ms, LINUX_GAP_MS - (performance.now() - lastLook))
            if (!stopped) timer = setTimeout(capture, ms)
        }
        const capture = async () => {
            if (draggedRef.current) return next(EVERY_MS)
            busy = true
            soon = false
            try {
                const buffer = await invoke<ArrayBuffer>('capture_backdrop', { step: STEP, shown })
                if (!stopped) setBackdrop(parseBackdrop(buffer, STEP))
            } catch (e) {
                // Unavailable: the text keeps its last colors
                console.warn('Could not see behind the window:', e)
            }
            busy = false
            lastLook = performance.now()
            const steady = IS_LINUX ? LINUX_EVERY_MS : shown ? SHOWN_EVERY_MS : EVERY_MS
            next(soon ? CHANGED_MS : steady)
        }
        capture()
        const soonish = (ms: number) => {
            if (busy) soon = true
            else next(ms)
        }
        hurryRef.current = (ms = CHANGED_MS) => soonish(ms)
        // Clicked, typed or scrolled somewhere: the screen is likely changing
        const input = listen('user-input', () => soonish(INPUT_MS))
        return () => {
            stopped = true
            clearTimeout(timer)
            input.then((off) => off())
        }
    }, [enabled, shown])

    // Look again soon, rather than at the usual pace: something changed, or
    // the window went to another monitor
    const hurry = useCallback(() => hurryRef.current(), [])

    return { backdrop, place, moving, hurry }
}
