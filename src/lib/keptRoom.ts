// The room the window keeps below the teleprompter for its toolbar on Linux,
// where growing the window for it each time is slow (see useWindowExpansion)

// The teleprompter never gets shorter than this by its bottom edge
export const MIN_FRAME_HEIGHT = 60

// The teleprompter's height in a window `height` tall that keeps `room`
// below it; a window not yet grown around it is still its own size
export const withoutRoom = (height: number, room: number) =>
    height > room ? height - room : height

// The share of the window's height that is the teleprompter, the only part
// worth looking behind
export const frameShare = (height: number, room: number) =>
    room && height > room ? (height - room) / height : 1

// Which parts of the window take clicks, as [x, y, width, height]: none in
// click-through mode, all of it while the toolbar is open in the room (or
// with no room kept), and otherwise only the teleprompter, so clicks on the
// empty room reach what is behind
export function inputRegion(
    frame: { width: number; height: number } | null,
    toolbarOpen: boolean,
    clickThrough: boolean,
): number[][] | null {
    if (clickThrough) return []
    if (!frame || toolbarOpen) return null
    return [[0, 0, frame.width, frame.height]]
}

// The teleprompter's height while its bottom edge is dragged by `dy`, kept
// within the window, which still needs room for the toolbar below it
export const draggedHeight = (start: number, dy: number, windowHeight: number, barRoom: number) =>
    Math.max(MIN_FRAME_HEIGHT, Math.min(windowHeight - barRoom, start + dy))
