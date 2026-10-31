export const IS_LINUX = navigator.userAgent.includes('Linux')
export const IS_WINDOWS = navigator.userAgent.includes('Windows')

// The window keeps room for the toolbar below the teleprompter all the time
// instead of growing for it: growing is slow on Linux, and makes the glass
// flicker on Windows (see useWindowExpansion)
export const KEEPS_ROOM = IS_LINUX || IS_WINDOWS
