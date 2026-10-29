import type { CSSProperties } from 'react'

// Inline style that paints a word in one color, or in a left-to-right blend
// of two when it straddles a light and a dark area. `alpha` (two hex digits)
// fades it.
export function wordPaint([left, right]: [string, string], alpha = ''): CSSProperties {
    if (left === right) return { color: left + alpha }
    return {
        color: 'transparent',
        backgroundImage: `linear-gradient(90deg, ${left}${alpha}, ${right}${alpha})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
    }
}
