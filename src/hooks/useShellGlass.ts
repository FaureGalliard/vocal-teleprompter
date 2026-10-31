import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { shellGlass } from '../lib/shellGlass'
import { roomBelow } from './useWindowExpansion'

// Frosted glass blurred live behind the window by the desktop or the window
// itself (the GNOME Shell extension on Linux, the window's own composition
// on Windows 11, the taskbar's blur on Windows 10), softened by `soften`
// (0-100) while `enabled`. It follows a video or a drag at once, with no
// look behind the window; only the letters wait for the looks. It leaves
// out the room below the text for the toolbar, where it can (Windows 10
// cannot, and leaves the glass to the app then). True while it is drawn,
// so the app need not draw its own.
export function useShellGlass(enabled: boolean, soften: number) {
    const [drawn, setDrawn] = useState(false)
    const radius = shellGlass(enabled, soften)

    useEffect(() => {
        let stopped = false
        let room = -1
        const send = () => {
            if (room === roomBelow()) return
            room = roomBelow()
            invoke<boolean>('set_glass', { radius, room })
                .then((ok) => !stopped && setDrawn(ok && radius > 0))
                .catch(() => !stopped && setDrawn(false))
        }
        send()
        // The room is only there once the window has grown around the text
        window.addEventListener('resize', send)
        return () => {
            stopped = true
            window.removeEventListener('resize', send)
        }
    }, [radius])

    return drawn
}
