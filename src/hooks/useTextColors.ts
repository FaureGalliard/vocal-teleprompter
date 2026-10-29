import { useEffect } from 'react'
import { ensureContrast } from '../lib/contrast'
import { useBackdrop } from './useBackdrop'
import { useBackdropView } from './useBackdropView'
import type { Settings } from './useSettings'

// Below this background opacity the backdrop shows through enough to matter
const SEE_THROUGH_BELOW = 0.85
// While editing, what is behind is softened all the way, so the text being
// typed stands out at once, before its colors are worked out
const EDITING_SOFTEN = 100

// How the text and what is behind it look. With auto contrast the chosen
// color is nudged until it reads well on the background. Once the
// background turns see-through, the app looks at what is behind the window:
// it can soften it like frosted glass, and color the text, point by point,
// so it reads over it.
export function useTextColors(settings: Settings, editing: boolean) {
    const { autoContrast, textColor, bgColor, hiddenFromCapture } = settings
    const backdropSoften = editing ? EDITING_SOFTEN : settings.backdropSoften
    const { bgOpacity } = settings
    const display = autoContrast ? ensureContrast(textColor, bgColor) : textColor
    const seeThrough = bgOpacity < SEE_THROUGH_BELOW && (autoContrast || backdropSoften > 0)
    const { backdrop, place, moving, hurry } = useBackdrop(seeThrough, !hiddenFromCapture)
    const view = useBackdropView(
        backdrop,
        place,
        { background: bgColor, opacity: bgOpacity },
        backdropSoften,
        display,
        // Moved onto another monitor: look at that one
        hurry,
    )
    // Something changed behind the window: follow it closely for a moment
    const version = view?.version
    useEffect(() => {
        if (version) hurry()
    }, [version, hurry])
    return {
        display,
        // Counts the looks behind the window, for coloring the text over them
        seen: autoContrast ? (view?.version ?? null) : null,
        glass: view?.glass ?? null,
        // Out of date while the window moves: faded out until it settles
        glassShown: !moving,
        opacity: bgOpacity,
    }
}
