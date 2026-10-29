import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { parseBackdrop, type Backdrop } from '../lib/backdrop'

// Physical pixels between samples: plenty for the color behind a word
const STEP = 2
const EVERY_MS = 300

// What is behind the window, refreshed a few times a second while `enabled`
// (a see-through background), so the text can keep reading well over a
// moving or changing backdrop
export function useBackdrop(enabled: boolean) {
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
                const buffer = await invoke<ArrayBuffer>('capture_backdrop', { step: STEP })
                if (!stopped) setBackdrop(parseBackdrop(buffer, STEP))
            } catch (e) {
                // Off screen or unavailable: the text keeps its last colors
                console.warn('Could not see behind the window:', e)
            }
            if (!stopped) timer = setTimeout(capture, EVERY_MS)
        }
        capture()
        return () => {
            stopped = true
            clearTimeout(timer)
        }
    }, [enabled])

    return backdrop
}
