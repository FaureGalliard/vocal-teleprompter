import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { parseBackdrop, type Backdrop, type Place } from '../lib/backdrop'
import { IS_LINUX } from '../lib/platform'
import { lookDelay, spaced, type LookReason } from '../lib/lookPace'
import { keptRoom } from './useWindowExpansion'
import { frameShare, withoutRoom } from '../lib/keptRoom'

// Physical pixels between samples: plenty for the color behind a letter
const STEP = 2
// The window counts as moving until it has held still this long
const STILL_MS = 150
// While dragged, how often to check whether it was let go
const DRAGGED_CHECK_MS = 300

// The teleprompter's own height in a window of `height` physical pixels,
// without the room kept below it for the toolbar on Linux
const frameHeight = (height: number) =>
    withoutRoom(height, Math.round(keptRoom * window.devicePixelRatio))

// What is behind the window, while `enabled` (a see-through background).
// Hidden from screen capture, each look covers the whole monitor, so moving
// or resizing the window needs no new look: `place` says where it now is, to
// cut that part out. `shown` in screen captures, each look covers just the
// window, painted by the windows behind it so the prompter never blinks in a
// recording, and a move brings a new one. Where Windows streams the monitor,
// a look only brings something when it changed, and Windows says when. Looks come at a steady pace, right
// after a click or a key, and closely after a change (`hurry`), at the pace
// lookPace sets for each system.
export function useBackdrop(enabled: boolean, shown: boolean) {
    const [backdrop, setBackdrop] = useState<Backdrop | null>(null)
    const [place, setPlace] = useState<Place | null>(null)
    const [moving, setMoving] = useState(false)
    // Look again soon, for this reason
    const soonRef = useRef<(reason: LookReason) => void>(() => {})
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
            if (!payload) soonRef.current('dropped')
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
        let soon: LookReason | null = null
        let timer: ReturnType<typeof setTimeout>
        let lastLook = 0
        const context = { linux: IS_LINUX, shown }
        const next = (ms: number) => {
            clearTimeout(timer)
            ms = spaced(ms, performance.now() - lastLook, IS_LINUX)
            if (!stopped) timer = setTimeout(capture, ms)
        }
        const capture = async () => {
            if (draggedRef.current) return next(DRAGGED_CHECK_MS)
            busy = true
            soon = null
            try {
                // Only behind the teleprompter, not the room kept below it
                const share = frameShare(window.innerHeight, keptRoom)
                const buffer = await invoke<ArrayBuffer>('capture_backdrop', {
                    step: STEP,
                    shown,
                    share,
                })
                // Empty when Windows streams the monitor and nothing changed
                if (!stopped && buffer.byteLength) setBackdrop(parseBackdrop(buffer, STEP))
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
            next(lookDelay(soon ? 'changed' : 'steady', context))
        }
        capture()
        soonRef.current = (reason) => {
            if (busy) soon = reason
            else next(lookDelay(reason, context))
        }
        // Clicked, typed or scrolled somewhere: the screen is likely changing
        const input = listen('user-input', () => soonRef.current('input'))
        // Windows streams the monitor and says when it changed, once until
        // the next look
        const changed = listen('backdrop-changed', () => soonRef.current('changed'))
        return () => {
            stopped = true
            clearTimeout(timer)
            input.then((off) => off())
            changed.then((off) => off())
            invoke('stop_backdrop').catch(() => {})
        }
    }, [enabled, shown])

    // Look again soon, rather than at the usual pace: something changed, or
    // the window went to another monitor
    const hurry = useCallback(() => soonRef.current('changed'), [])

    return { backdrop, place, moving, hurry }
}
