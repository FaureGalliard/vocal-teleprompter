import { describe, expect, it } from 'vitest'
import { LINUX_GAP_MS, lookDelay, spaced, type LookReason } from './lookPace'

const linux = { linux: true, shown: false }
const windows = { linux: false, shown: false }

describe('lookDelay on Linux', () => {
    it('follows a video behind the window, with no input at all', () => {
        // Regression: changes only brought three more looks, then one every
        // ten seconds, and the text colors never caught up with a video
        expect(lookDelay('changed', linux)).toBeLessThanOrEqual(500)
    })

    it('never leaves the colors more than a second behind when nothing happens', () => {
        // Regression: a look every two (then ten) seconds felt laggy
        expect(lookDelay('steady', linux)).toBeLessThanOrEqual(1000)
    })

    it('still spaces looks out, as each one stalls the whole desktop', () => {
        // Regression: looks every 120 ms over a video made the desktop stutter
        for (const reason of ['steady', 'changed', 'input', 'dropped'] as LookReason[])
            expect(spaced(lookDelay(reason, linux), 0, true)).toBeGreaterThanOrEqual(LINUX_GAP_MS)
    })

    it('looks right away after input or a drag once the gap has passed', () => {
        expect(spaced(lookDelay('input', linux), LINUX_GAP_MS, true)).toBeLessThanOrEqual(80)
        expect(spaced(lookDelay('dropped', linux), LINUX_GAP_MS, true)).toBe(0)
    })
})

describe('lookDelay on Windows', () => {
    it('keeps its steady pace, which costs the desktop nothing there', () => {
        expect(lookDelay('steady', windows)).toBe(300)
        expect(lookDelay('steady', { linux: false, shown: true })).toBe(500)
        expect(lookDelay('changed', windows)).toBe(120)
        expect(lookDelay('input', windows)).toBe(80)
    })

    it('is never held back by the Linux gap', () => {
        expect(spaced(80, 0, false)).toBe(80)
    })
})
