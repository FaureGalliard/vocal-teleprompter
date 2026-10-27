// WCAG 2 contrast helpers for #rrggbb colors

// Minimum ratio WCAG asks for normal-size text (AA)
export const MIN_CONTRAST = 4.5

type RGB = [number, number, number]

function parseHex(hex: string): RGB {
    const h = hex.replace('#', '')
    const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
    const n = parseInt(full, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: RGB): string {
    return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function luminance(hex: string): number {
    const [r, g, b] = parseHex(hex).map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
    const la = luminance(a)
    const lb = luminance(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Black or white, whichever stands out more against the color
export function bestOutline(hex: string): string {
    return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#ffffff')
        ? '#000000'
        : '#ffffff'
}

function mix(a: RGB, b: RGB, t: number): RGB {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

// Returns the text color unchanged when it already reads well on the
// background; otherwise blends it toward white or black just enough to reach
// the minimum ratio, so the chosen hue is kept as much as possible.
export function ensureContrast(text: string, background: string, min = MIN_CONTRAST) {
    if (contrastRatio(text, background) >= min) return text
    const target = bestOutline(background)
    const from = parseHex(text)
    const to = parseHex(target)
    let lo = 0
    let hi = 1
    for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        if (contrastRatio(toHex(mix(from, to, mid)), background) >= min) hi = mid
        else lo = mid
    }
    return toHex(mix(from, to, hi))
}
