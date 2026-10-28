import { useEffect, useRef, useState } from 'react'
import {
    currentMonitor,
    getCurrentWindow,
    LogicalPosition,
    LogicalSize,
} from '@tauri-apps/api/window'

// Room the toolbar needs beside the teleprompter
export const TOOLBAR_GUTTER = 60
// Height the window grows to while the toolbar is open, so the toolbar and
// its panels fit even when the teleprompter is a thin strip
const OPEN_HEIGHT = 720

export interface Expansion {
    // Size of the teleprompter itself, which stays put while the window grows
    frame: { width: number; height: number }
    // Which side the toolbar sits on, outside the frame
    side: 'left' | 'right'
}

// While `open`, grows the window with a transparent area beside (and below)
// the teleprompter so the toolbar and its panels sit outside the text
// instead of covering it or being cut off; shrinks it back when closed.
// Returns null when the window cannot grow (maximized), so the toolbar
// falls back to sitting over the text.
export function useWindowExpansion(open: boolean) {
    const [expansion, setExpansion] = useState<Expansion | null>(null)
    const restoreRef = useRef<(() => Promise<void>) | null>(null)

    useEffect(() => {
        if (!open) return
        let cancelled = false
        const win = getCurrentWindow()

        const grow = async () => {
            if (await win.isMaximized()) return
            const scale = await win.scaleFactor()
            const size = (await win.innerSize()).toLogical(scale)
            const position = (await win.outerPosition()).toLogical(scale)
            const monitor = await currentMonitor()
            const area = monitor
                ? {
                      x: monitor.workArea.position.x / scale,
                      y: monitor.workArea.position.y / scale,
                      width: monitor.workArea.size.width / scale,
                      height: monitor.workArea.size.height / scale,
                  }
                : null
            if (cancelled) return

            // Grow to the right when there is room on that side of the screen
            const roomRight = !area || position.x + size.width + TOOLBAR_GUTTER <= area.x + area.width
            const side = roomRight ? 'right' : 'left'
            const bottomLimit = area ? area.y + area.height - position.y : OPEN_HEIGHT
            const height = Math.max(size.height, Math.min(OPEN_HEIGHT, bottomLimit))

            await win.setResizable(false)
            if (side === 'left') await win.setPosition(new LogicalPosition(position.x - TOOLBAR_GUTTER, position.y))
            await win.setSize(new LogicalSize(size.width + TOOLBAR_GUTTER, height))
            if (!cancelled) setExpansion({ frame: { width: size.width, height: size.height }, side })

            restoreRef.current = async () => {
                // Relative to where the window is now, in case it was dragged
                const now = (await win.outerPosition()).toLogical(await win.scaleFactor())
                await win.setSize(new LogicalSize(size.width, size.height))
                if (side === 'left') await win.setPosition(new LogicalPosition(now.x + TOOLBAR_GUTTER, now.y))
                await win.setResizable(true)
            }
        }
        const growing = grow().catch((e) => console.error('Could not make room for the toolbar:', e))

        return () => {
            cancelled = true
            setExpansion(null)
            // Wait for a grow still in progress, then undo it
            growing.then(() => {
                const restore = restoreRef.current
                restoreRef.current = null
                return restore?.()
            }).catch((e) => console.error('Could not restore the window:', e))
        }
    }, [open])

    return expansion
}
