import { useEffect, type RefObject } from 'react'

// While `active`, calls `onOutside` when the mouse is pressed outside all of
// `refs` (a menu's button and its panel, which lives in a portal)
export function useOutsideClick(
    refs: RefObject<HTMLElement | null>[],
    active: boolean,
    onOutside: () => void,
) {
    useEffect(() => {
        if (!active) return
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (!refs.some((r) => r.current?.contains(target))) onOutside()
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [refs, active, onOutside])
}
