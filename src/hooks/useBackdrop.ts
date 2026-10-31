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
// desktop, where it stalls everything on screen for a moment, so looks come
// only when something likely changed: after input anywhere or a drag, and
// for at most a few more rounds while what is behind keeps changing (a
// slide transition, not a whole video), never closer than the gap. Changes
// that come with no input at all are caught by a rare look on its own.
const LINUX_GAP_MS = 400
const LINUX_FOLLOW_UPS = 3
const LINUX_IDLE_MS = 10_000

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
// after a click or a key, and closely after a change (`hurry`); on Linux
// only then (see LINUX_FOLLOW_UPS).
export function useBackdrop(enabled: boolean, shown: boolean) {
    const [backdrop, setBackdrop] = useState<Backdrop | null>(null)
    const [place, setPlace] = useState<Place | null>(null)
    const [moving, setMoving] = useState(false)
    const hurryRef = useRef<(ms?: number) => void>(() => {})
    // Something the user did may have changed the screen: look soon
    const inputRef = useRef<(ms: number) => void>(() => {})
    // Dragged, as the GNOME Shell extension tells: no looks until it stops
    const draggedRef = useRef(false)
    // Let go after a drag on Linux, where the last look only covered where
    // the window was: it counts as moving until a new look lands, so the
    // glass from the old spot does not show at the new one
    const staleRef = useRef(false)

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
            if (payload) setMoving(true)
            else if (IS_LINUX) staleRef.current = true
            else setMoving(false)
            if (!payload) inputRef.current(0)
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
        // Looks a change may still bring before the next input (Linux)
        let followUps = LINUX_FOLLOW_UPS
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
                // Only behind the teleprompter, not the room kept below it
                const share =
                    keptRoom && window.innerHeight > keptRoom
                        ? (window.innerHeight - keptRoom) / window.innerHeight
                        : 1
                const buffer = await invoke<ArrayBuffer>('capture_backdrop', {
                    step: STEP,
                    shown,
                    share,
                })
                if (!stopped) setBackdrop(parseBackdrop(buffer, STEP))
            } catch (e) {
                // Unavailable: the text keeps its last colors
                console.warn('Could not see behind the window:', e)
            }
            if (staleRef.current && !draggedRef.current) {
                staleRef.current = false
                setMoving(false)
            }
            busy = false
            lastLook = performance.now()
            const steady = IS_LINUX ? LINUX_IDLE_MS : shown ? SHOWN_EVERY_MS : EVERY_MS
            next(soon ? CHANGED_MS : steady)
        }
        capture()
        const soonish = (ms: number) => {
            if (busy) soon = true
            else next(ms)
        }
        hurryRef.current = (ms = CHANGED_MS) => {
            if (IS_LINUX && followUps-- <= 0) return
            soonish(ms)
        }
        inputRef.current = (ms) => {
            followUps = LINUX_FOLLOW_UPS
            soonish(ms)
        }
        // Clicked, typed or scrolled somewhere: the screen is likely changing
        const input = listen('user-input', () => inputRef.current(INPUT_MS))
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
