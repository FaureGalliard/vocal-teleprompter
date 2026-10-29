import { useEffect } from 'react'
import {
    currentMonitor,
    getCurrentWindow,
    LogicalSize,
    PhysicalPosition,
    primaryMonitor,
} from '@tauri-apps/api/window'

// A strip a few lines tall, wide enough for a comfortable line length
const DEFAULT_SIZE = { width: 1080, height: 165 }
const TOP_MARGIN = 8

// Puts the window at the top center of the screen, right under where a
// webcam usually sits, and only then shows it (it starts hidden so it does
// not appear somewhere else first)
export function useWindowPlacement() {
    useEffect(() => {
        const win = getCurrentWindow()
        const place = async () => {
            const monitor = (await currentMonitor()) ?? (await primaryMonitor())
            if (!monitor) return
            const scale = monitor.scaleFactor
            const area = monitor.workArea
            const width = Math.min(DEFAULT_SIZE.width, area.size.width / scale - 32)
            await win.setSize(new LogicalSize(width, DEFAULT_SIZE.height))
            await win.setPosition(
                new PhysicalPosition(
                    Math.round(area.position.x + (area.size.width - width * scale) / 2),
                    Math.round(area.position.y + TOP_MARGIN * scale),
                ),
            )
        }
        place()
            .catch((e) => console.error('Could not place the window:', e))
            .finally(() => win.show().catch((e) => console.error(e)))
    }, [])
}
