import { ensureContrast } from '../lib/contrast'
import { useBackdrop } from './useBackdrop'
import { useBackdropView } from './useBackdropView'
import type { Settings } from './useSettings'

// Below this background opacity the backdrop shows through enough to matter
const SEE_THROUGH_BELOW = 0.85
// While editing the text is a plain field that can't be colored letter by
// letter, so the background turns this solid to keep it readable
const EDITING_OPACITY = 0.9

// How the text and what is behind it look. With auto contrast the chosen
// color is nudged until it reads well on the background. Once the
// background turns see-through, the app looks at what is behind the window:
// it can soften it like frosted glass, and color the text, point by point,
// so it reads over it.
export function useTextColors(settings: Settings, editing: boolean) {
    const { autoContrast, textColor, bgColor, hiddenFromCapture, backdropSoften } = settings
    const bgOpacity = editing ? Math.max(settings.bgOpacity, EDITING_OPACITY) : settings.bgOpacity
    const display = autoContrast ? ensureContrast(textColor, bgColor) : textColor
    const seeThrough = bgOpacity < SEE_THROUGH_BELOW && (autoContrast || backdropSoften > 0)
    const { backdrop, moving } = useBackdrop(seeThrough, !hiddenFromCapture)
    const view = useBackdropView(
        backdrop,
        { background: bgColor, opacity: bgOpacity },
        backdropSoften,
    )
    return {
        display,
        seen: autoContrast ? (view?.seen ?? null) : null,
        glass: view?.glass ?? null,
        // Out of date while the window moves: faded out until it settles
        glassShown: !moving,
        opacity: bgOpacity,
    }
}
