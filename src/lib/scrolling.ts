// How the script follows the speaker
export interface Scrolling {
    // fixed: the current line stays at one height of the window.
    // ahead: the text holds still until the current line nears the bottom,
    // then moves just enough to keep `linesBelow` lines visible under it.
    mode: 'fixed' | 'ahead'
    // Height of the current line in fixed mode, as a share of the window
    anchor: number
    linesBelow: number
}

export const DEFAULT_SCROLLING: Scrolling = { mode: 'ahead', anchor: 0.4, linesBelow: 3 }

// Where to scroll the canvas so the word sits where the mode wants it, or
// null to leave it where it is
export function scrollTarget(
    scrolling: Scrolling,
    view: { top: number; height: number },
    word: { top: number; height: number },
    lineHeight: number,
): number | null {
    if (scrolling.mode === 'fixed') {
        return word.top - view.height * scrolling.anchor + word.height / 2
    }
    const neededBottom = word.top + word.height + scrolling.linesBelow * lineHeight
    if (neededBottom > view.top + view.height) return neededBottom - view.height
    // Moved back above the visible part (a click, the arrows)
    if (word.top < view.top) return Math.max(0, word.top - lineHeight)
    return null
}
