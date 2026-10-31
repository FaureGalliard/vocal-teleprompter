// How soon to look behind the window again, and why.
//
// Windows captures cost the desktop nothing, so looks come at a steady pace.
// On Linux GNOME Shell paints each look on the thread that draws the whole
// desktop, where it stalls everything on screen for a moment, so looks are
// spaced out there: right after input anywhere or a drag, every half second
// while what is behind keeps changing (a video), once a second while it stays
// the same, and never closer than the gap.

// Nothing in particular: the steady pace
//   changed: the last look found something new (a slide transition, a video)
//   input: a click, a key or the wheel anywhere, what most slide changes follow
//   dropped: the window was let go after a drag
export type LookReason = 'steady' | 'changed' | 'input' | 'dropped'

export interface LookContext {
    linux: boolean
    // Shown in screen captures: on Windows the windows behind it then paint
    // themselves for each look, which costs them some work
    shown: boolean
}

export const LINUX_GAP_MS = 400

export function lookDelay(reason: LookReason, { linux, shown }: LookContext): number {
    switch (reason) {
        case 'steady':
            return linux ? 1000 : shown ? 500 : 300
        case 'changed':
            return linux ? 500 : 120
        case 'input':
            return 80
        case 'dropped':
            return 0
    }
}

// `ms` from now, or later on Linux if the last look ended under the gap ago
export function spaced(ms: number, sinceLastLook: number, linux: boolean) {
    return linux ? Math.max(ms, LINUX_GAP_MS - sinceLastLook) : ms
}
