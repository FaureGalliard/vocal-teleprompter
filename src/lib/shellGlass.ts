import { bestOutline } from './contrast'

// Blur radius of the desktop's own glass at 100% softening, in pixels:
// about as soft as the glass the app draws from its looks
export const MAX_RADIUS = 16

// The glass to ask the desktop for: a blur `radius` (0 for none) and whether
// to tint it dark. Softened by `soften` (0-100) while `enabled`. Windows
// frosts the whole window, so it asks for none while the window grows for
// the `toolbarOpen`, and the app draws its own glass meanwhile; on Linux the
// GNOME Shell extension leaves that room out.
export function shellGlass({
    enabled,
    soften,
    background,
    toolbarOpen,
    linux,
}: {
    enabled: boolean
    soften: number
    background: string
    toolbarOpen: boolean
    linux: boolean
}) {
    const shown = enabled && (linux || !toolbarOpen)
    return {
        radius: shown ? Math.round((soften / 100) * MAX_RADIUS) : 0,
        // A dark background reads best with white letters
        dark: bestOutline(background) === '#ffffff',
    }
}
