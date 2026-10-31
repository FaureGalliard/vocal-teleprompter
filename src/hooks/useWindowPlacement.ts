import { useEffect, useRef } from 'react'
import {
    availableMonitors,
    currentMonitor,
    getCurrentWindow,
    LogicalSize,
    PhysicalPosition,
    primaryMonitor,
} from '@tauri-apps/api/window'
import { loadPersistent, savePersistent } from './usePersistentState'
import { keptRoom } from './useWindowExpansion'
import { withoutRoom } from '../lib/keptRoom'
import { KEEPS_ROOM } from '../lib/platform'

// A strip a few lines tall, wide enough for a comfortable line length
const DEFAULT_SIZE = { width: 1080, height: 165 }
const TOP_MARGIN = 8
const KEY = 'windowBounds'

// Position in physical pixels, size in logical ones, so the size holds when
// the window moves to a screen with another scale
interface Bounds {
    x: number
    y: number
    width: number
    height: number
}

let placed: Promise<void> = Promise.resolve()
// Settles once the window is in place, so growing it for the toolbar (the
// first-run tour opens it right away) measures it at its own size
export const whenPlaced = () => placed

// Opens the window where and as big as it was left, or the first time at
// the top center of the screen, right under where a webcam usually sits.
// It starts hidden and shows once in place, so it never appears somewhere
// else first.
// While `paused` the window is not at its own size (it grew for the
// toolbar), so moves and resizes are not remembered. On Linux and Windows
// the window keeps that room all the time instead, and the size remembered
// is the teleprompter's, without it.
export function useWindowPlacement(paused: boolean) {
    const pausedRef = useRef(paused)
    pausedRef.current = paused && !KEEPS_ROOM

    useEffect(() => {
        const win = getCurrentWindow()

        const restore = async () => {
            const saved = loadPersistent<Bounds | null>(KEY, null)
            // Only if its top edge is still on a screen (one may have been unplugged)
            const monitors = saved ? await availableMonitors() : []
            const onScreen =
                saved &&
                monitors.some(({ workArea: a }) => {
                    const x = saved.x + 40
                    return (
                        x >= a.position.x &&
                        x < a.position.x + a.size.width &&
                        saved.y >= a.position.y &&
                        saved.y < a.position.y + a.size.height
                    )
                })
            if (saved && onScreen) {
                await win.setSize(new LogicalSize(saved.width, saved.height))
                await win.setPosition(new PhysicalPosition(saved.x, saved.y))
                return
            }

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

        // Remembered a moment after the window stops moving or resizing
        let timer: ReturnType<typeof setTimeout> | undefined
        const remember = () => {
            clearTimeout(timer)
            timer = setTimeout(async () => {
                if (pausedRef.current || (await win.isMaximized()) || !(await win.isVisible()))
                    return
                const scale = await win.scaleFactor()
                const position = await win.outerPosition()
                const size = (await win.innerSize()).toLogical(scale)
                // Not yet grown around the teleprompter: still its own size
                const height = withoutRoom(size.height, keptRoom)
                if (pausedRef.current) return
                savePersistent<Bounds>(KEY, {
                    x: position.x,
                    y: position.y,
                    width: size.width,
                    height,
                })
            }, 400)
        }

        let unlisten: (() => void)[] = []
        let disposed = false
        placed = restore()
            .catch((e) => console.error('Could not place the window:', e))
            .finally(() => win.show().catch((e) => console.error(e)))
        placed.then(async () => {
            const offs = await Promise.all([win.onMoved(remember), win.onResized(remember)])
            if (disposed) offs.forEach((off) => off())
            else unlisten = offs
        })

        return () => {
            disposed = true
            clearTimeout(timer)
            unlisten.forEach((off) => off())
        }
    }, [])
}
