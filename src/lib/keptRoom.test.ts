import { describe, expect, it } from 'vitest'
import {
    draggedHeight,
    frameShare,
    inputRegion,
    keptWindowSize,
    MIN_FRAME_HEIGHT,
    withoutRoom,
} from './keptRoom'

const frame = { width: 1080, height: 165 }

describe('inputRegion', () => {
    it('lets clicks on the empty room through while the toolbar is closed', () => {
        // Regression: the room kept for the toolbar would swallow every click
        // under the teleprompter, as a window that big is all clickable
        expect(inputRegion(frame, false, false)).toEqual([[0, 0, 1080, 165]])
    })

    it('takes clicks everywhere while the toolbar is open in the room', () => {
        expect(inputRegion(frame, true, false)).toBeNull()
    })

    it('takes no clicks at all in click-through mode, toolbar or not', () => {
        expect(inputRegion(frame, false, true)).toEqual([])
        expect(inputRegion(frame, true, true)).toEqual([])
    })

    it('takes clicks everywhere when no room is kept (maximized)', () => {
        expect(inputRegion(null, false, false)).toBeNull()
    })
})

describe('withoutRoom', () => {
    it('remembers and looks behind the teleprompter, not the room', () => {
        // Regression: the window's size, room included, would be remembered
        // and the window would come back taller on each start
        expect(withoutRoom(165 + 496, 496)).toBe(165)
    })

    it('leaves a window not yet grown around the teleprompter as it is', () => {
        expect(withoutRoom(165, 496)).toBe(165)
        expect(withoutRoom(165, 0)).toBe(165)
    })
})

describe('frameShare', () => {
    it('is the teleprompter part of the window, for the looks and the glass', () => {
        expect(frameShare(200 + 496, 496)).toBeCloseTo(200 / 696)
        expect(frameShare(200, 0)).toBe(1)
        expect(frameShare(200, 496)).toBe(1)
    })
})

describe('draggedHeight', () => {
    it('follows the bottom edge, which is no longer the window edge', () => {
        expect(draggedHeight(165, 40, 661, 56)).toBe(205)
    })

    it('keeps the teleprompter usable and the toolbar room in the window', () => {
        expect(draggedHeight(165, -500, 661, 56)).toBe(MIN_FRAME_HEIGHT)
        expect(draggedHeight(165, 900, 661, 56)).toBe(661 - 56)
    })
})

describe('keptWindowSize', () => {
    it('grows the window by the room below the teleprompter', () => {
        expect(keptWindowSize({ width: 1080, height: 165 }, 496)).toEqual({
            width: 1080,
            height: 661,
        })
    })

    it('never grows a window that has no size yet', () => {
        // Regression: the installed app read the size of the page before it
        // had one, pinned the teleprompter at 0x0 and showed nothing at all
        expect(keptWindowSize({ width: 0, height: 0 }, 496)).toBeNull()
        expect(keptWindowSize({ width: 1080, height: 0 }, 496)).toBeNull()
        expect(keptWindowSize({ width: NaN, height: 165 }, 496)).toBeNull()
    })
})
