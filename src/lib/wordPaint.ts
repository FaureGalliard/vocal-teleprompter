import type { CSSProperties } from 'react'
import type { BackdropPaint } from '../hooks/useBackdropPaint'

// Paints a piece of text from the backdrop's color map, lined up with where
// it sits in the window, so every letter takes the color readable over what
// is right behind it. `fade` (0-1) dims words already read. Null when the
// piece isn't on the map (out of view, or no map yet).
export function paintFrom(
    paint: BackdropPaint | null,
    at: number,
    fade: number,
): CSSProperties | null {
    const offset = paint?.offsets.get(at)
    if (!paint || !offset) return null
    return {
        color: 'transparent',
        backgroundImage: `url(${paint.url})`,
        backgroundSize: `${paint.width}px ${paint.height}px`,
        backgroundPosition: `${-offset[0]}px ${-offset[1]}px`,
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        opacity: fade,
    }
}
