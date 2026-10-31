// Blur radius of the desktop's own glass at 100% softening, in pixels:
// about as soft as the glass the app draws from its looks
export const MAX_RADIUS = 16

// The blur radius to ask the live glass for, 0 for none: softened by
// `soften` (0-100) while `enabled`
export function shellGlass(enabled: boolean, soften: number) {
    return enabled ? Math.round((Math.max(0, soften) / 100) * MAX_RADIUS) : 0
}
