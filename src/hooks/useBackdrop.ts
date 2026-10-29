import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { parseBackdrop, type Backdrop } from '../lib/backdrop'

// Physical pixels between samples: plenty for the color behind a word
const STEP = 2
const EVERY_MS = 300
// While the window shows in screen captures it is hidden for each look, so
// look less often: a recording loses it for a moment each time
const SHOWN_EVERY_MS = 800
// After the window moves
const MOVED_MS = 60
// The window counts as moving until it has held still this long
const STILL_MS = 250

// What is behind the window, refreshed a few times a second while `enabled`
// (a see-through background), so the text can keep reading well over a
// moving or changing backdrop. `shown`: the window is visible to screen
// captures, so it has to step out of the way for each look.
export function useBackdrop(enabled: boolean, shown: boolean) {
    const [backdrop, setBackdrop] = useState<Backdrop | null>(null)
    const [moving, setMoving] = useState(false)

    useEffect(() => {
        if (!enabled) {
            setBackdrop(null)
            return
        }
        let stopped = false
        let busy = false
        // Moved while a look was underway: take the next one soon
        let soon = false
        let timer: ReturnType<typeof setTimeout>
        const next = (ms: number) => {
            clearTimeout(timer)
            if (!stopped) timer = setTimeout(capture, ms)
        }
        const capture = async () => {
            busy = true
            soon = false
            try {
                const buffer = await invoke<ArrayBuffer>('capture_backdrop', { step: STEP, shown })
                if (!stopped) setBackdrop(parseBackdrop(buffer, STEP))
            } catch (e) {
                // Off screen or unavailable: the text keeps its last colors
                console.warn('Could not see behind the window:', e)
            }
            busy = false
            next(soon ? MOVED_MS : shown ? SHOWN_EVERY_MS : EVERY_MS)
        }
        capture()
        // Moved: look again soon, so the glass and colors keep up with it
        let still: ReturnType<typeof setTimeout>
        const moved = getCurrentWindow().onMoved(() => {
            setMoving(true)
            clearTimeout(still)
            still = setTimeout(() => setMoving(false), STILL_MS)
            if (busy) soon = true
            else next(MOVED_MS)
        })
        return () => {
            stopped = true
            clearTimeout(timer)
            clearTimeout(still)
            moved.then((off) => off())
        }
    }, [enabled, shown])

    return { backdrop, moving }
}
