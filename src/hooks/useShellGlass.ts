import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { IS_LINUX } from '../lib/platform'
import { shellGlass } from '../lib/shellGlass'
import { keptRoom } from './useWindowExpansion'

// Frosted glass blurred live by the desktop itself behind the window (the
// GNOME Shell extension on Linux, Windows' blur behind a window), softened
// by `soften` (0-100) while `enabled`. It follows a video or a drag at once,
// with no look behind the window; only the letters wait for the looks. On
// Linux it leaves out the room kept below the text for the toolbar;
// Windows frosts the whole window, so there it gives way to the app's own
// glass while the window grows for the `toolbarOpen`. True while the
// desktop draws it, so the app need not draw its own.
export function useShellGlass(enabled: boolean, soften: number, toolbarOpen: boolean) {
    const [drawn, setDrawn] = useState(false)
    const radius = shellGlass({ enabled, soften, toolbarOpen, linux: IS_LINUX })

    useEffect(() => {
        let stopped = false
        let room = -1
        const send = () => {
            if (room === keptRoom) return
            room = keptRoom
            invoke<boolean>('set_glass', { radius, room })
                .then((ok) => !stopped && setDrawn(ok && radius > 0))
                .catch(() => !stopped && setDrawn(false))
        }
        send()
        // The room is only kept once the window has grown around the text
        window.addEventListener('resize', send)
        return () => {
            stopped = true
            window.removeEventListener('resize', send)
        }
    }, [radius])

    return drawn
}
