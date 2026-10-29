import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { parseBackdrop, type Backdrop } from '../lib/backdrop'

// Physical pixels between samples: plenty for the color behind a word
const STEP = 2
const EVERY_MS = 300
// While the window shows in screen captures it is hidden for each look, so
// look less often: a recording loses it for a moment each time
const SHOWN_EVERY_MS = 800

// What is behind the window, refreshed a few times a second while `enabled`
// (a see-through background), so the text can keep reading well over a
// moving or changing backdrop. `shown`: the window is visible to screen
// captures, so it has to step out of the way for each look.
export function useBackdrop(enabled: boolean, shown: boolean) {
    const [backdrop, setBackdrop] = useState<Backdrop | null>(null)

    useEffect(() => {
        if (!enabled) {
            setBackdrop(null)
            return
        }
        let stopped = false
        let timer: ReturnType<typeof setTimeout>
        const capture = async () => {
            try {
                const buffer = await invoke<ArrayBuffer>('capture_backdrop', { step: STEP, shown })
                if (!stopped) setBackdrop(parseBackdrop(buffer, STEP))
            } catch (e) {
                // Off screen or unavailable: the text keeps its last colors
                console.warn('Could not see behind the window:', e)
            }
            if (!stopped) timer = setTimeout(capture, shown ? SHOWN_EVERY_MS : EVERY_MS)
        }
        capture()
        return () => {
            stopped = true
            clearTimeout(timer)
        }
    }, [enabled, shown])

    return backdrop
}
