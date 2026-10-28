export const FONTS = {
    sans: 'ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, Consolas, "Cascadia Mono", monospace',
    rounded: 'ui-rounded, "Arial Rounded MT Bold", "Segoe UI", sans-serif',
    // Wide letters and open shapes, easy to read at a distance
    legible: 'Verdana, "Segoe UI", sans-serif',
} as const

export type FontKey = keyof typeof FONTS

export interface Typography {
    font: FontKey
    weight: 400 | 600 | 700
    lineHeight: number
    // Share of the canvas width the text may use, so lines stay short and
    // the eyes travel less
    width: number
    align: 'center' | 'left'
}

export const DEFAULT_TYPOGRAPHY: Typography = {
    font: 'sans',
    weight: 400,
    lineHeight: 1.625,
    width: 100,
    align: 'center',
}
