import { useEffect } from 'react'
import { cursorPosition, getCurrentWindow } from '@tauri-apps/api/window'

// Nothing is drawn there: the page itself or a wrapper marked as layout only
const isEmptySpace = (el: Element | null) =>
    !el ||
    el === document.documentElement ||
    el === document.body ||
    el.id === 'root' ||
    (el as HTMLElement).dataset.passThrough !== undefined

// While `active` (the window grew a see-through area for the toolbar),
// clicks on that area reach whatever is behind the window instead of doing
// nothing, as if the window ended where its drawn parts do.
// Windows can only make the whole window ignore the mouse, and then it hears
// no mouse events at all, so the cursor is polled to tell when it is back
// over something drawn.
export function usePassThroughGaps(active: boolean) {
    useEffect(() => {
        if (!active) return
        const win = getCurrentWindow()
        let ignoring = false
        let stopped = false
        // Never while a button is held: a slider dragged past its panel
        // would lose the mouse halfway
        let pressed = false
        const onDown = () => (pressed = true)
        const onUp = () => (pressed = false)
        window.addEventListener('pointerdown', onDown, true)
        window.addEventListener('pointerup', onUp, true)

        let timer: ReturnType<typeof setTimeout>
        const tick = async () => {
            try {
                const [cursor, origin, scale] = await Promise.all([
                    cursorPosition(),
                    win.innerPosition(),
                    win.scaleFactor(),
                ])
                const x = (cursor.x - origin.x) / scale
                const y = (cursor.y - origin.y) / scale
                const inside = x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight
                const ignore = inside && !pressed && isEmptySpace(document.elementFromPoint(x, y))
                if (ignore !== ignoring && !stopped) {
                    ignoring = ignore
                    await win.setIgnoreCursorEvents(ignore)
                }
            } catch (e) {
                console.error('Could not let clicks through:', e)
            }
            if (!stopped) timer = setTimeout(tick, 50)
        }
        timer = setTimeout(tick, 0)

        return () => {
            stopped = true
            clearTimeout(timer)
            window.removeEventListener('pointerdown', onDown, true)
            window.removeEventListener('pointerup', onUp, true)
            if (ignoring) win.setIgnoreCursorEvents(false).catch((e) => console.error(e))
        }
    }, [active])
}
