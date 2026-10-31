import { describe, expect, it } from 'vitest'
import { MAX_RADIUS, shellGlass } from './shellGlass'

const glass = (over: Partial<Parameters<typeof shellGlass>[0]> = {}) =>
    shellGlass({
        enabled: true,
        soften: 100,
        background: '#000000',
        toolbarOpen: false,
        linux: false,
        ...over,
    })

describe('shellGlass', () => {
    it('softens as much as asked', () => {
        expect(glass().radius).toBe(MAX_RADIUS)
        expect(glass({ soften: 50 }).radius).toBe(MAX_RADIUS / 2)
        expect(glass({ soften: 0 }).radius).toBe(0)
    })

    it('asks for none while the background is not see-through', () => {
        expect(glass({ enabled: false }).radius).toBe(0)
    })

    it('gives way to the app glass while the toolbar grows the window on Windows', () => {
        expect(glass({ toolbarOpen: true }).radius).toBe(0)
    })

    it('keeps it with the toolbar open on Linux, where the room is left out', () => {
        expect(glass({ toolbarOpen: true, linux: true }).radius).toBe(MAX_RADIUS)
    })

    it('tints it as dark or light as the background is', () => {
        expect(glass({ background: '#101010' }).dark).toBe(true)
        expect(glass({ background: '#f4f4f4' }).dark).toBe(false)
    })
})
