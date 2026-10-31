import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { IS_LINUX } from '../lib/platform'
import { bestOutline } from '../lib/contrast'
import { keptRoom } from './useWindowExpansion'

// Blur radius of the desktop's own glass at 100% softening, in pixels:
// about as soft as the glass the app draws from its looks
const MAX_RADIUS = 16

// Frosted glass blurred live by the desktop itself behind the window (the
// GNOME Shell extension on Linux, Windows 11's acrylic), softened by `soften`
// (0-100) while `enabled`. It follows a video or a drag at once, with no
// look behind the window. On Linux it leaves out the room kept below the
// text for the toolbar; Windows frosts the whole window, so there it gives
// way to the app's own glass while the window grows for the `toolbarOpen`.
// Windows tints it dark or light, as `background` is. True while the
// desktop draws it, so the app need not draw its own.
export function useShellGlass(
    enabled: boolean,
    soften: number,
    background: string,
    toolbarOpen: boolean,
) {
    const [drawn, setDrawn] = useState(false)
    const shown = enabled && (IS_LINUX || !toolbarOpen)
    const radius = shown ? Math.round((soften / 100) * MAX_RADIUS) : 0
    const dark = bestOutline(background) === '#ffffff'

    useEffect(() => {
        let stopped = false
        let room = -1
        const send = () => {
            if (room === keptRoom) return
            room = keptRoom
            invoke<boolean>('set_glass', { radius, room, dark })
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
    }, [radius, dark])

    return drawn
}
