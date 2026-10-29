import { bestOutline, ensureContrast } from '../lib/contrast'
import { useBackdrop } from './useBackdrop'
import type { Settings } from './useSettings'

// Below this background opacity the backdrop shows through enough to matter
const SEE_THROUGH_BELOW = 0.85

// How the text is colored. With auto contrast the chosen color is nudged
// until it reads well on the background. Once the background turns
// see-through, what is behind the window shows, so each word gets its color
// from what is behind it (and a soft halo until that is known).
export function useTextColors(settings: Settings) {
    const { autoContrast, textColor, bgColor, bgOpacity, hiddenFromCapture } = settings
    const display = autoContrast ? ensureContrast(textColor, bgColor) : textColor
    const seeThrough = autoContrast && bgOpacity < SEE_THROUGH_BELOW
    const backdrop = useBackdrop(seeThrough)
    return {
        display,
        halo: seeThrough ? bestOutline(display) : undefined,
        backdrop,
        surface: { hiddenFromCapture, background: bgColor, opacity: bgOpacity },
    }
}
