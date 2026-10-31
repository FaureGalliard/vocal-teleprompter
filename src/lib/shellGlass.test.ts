import { describe, expect, it } from 'vitest'
import { MAX_RADIUS, shellGlass } from './shellGlass'

describe('shellGlass', () => {
    it('softens as much as asked', () => {
        expect(shellGlass(true, 100)).toBe(MAX_RADIUS)
        expect(shellGlass(true, 50)).toBe(MAX_RADIUS / 2)
        expect(shellGlass(true, 0)).toBe(0)
    })

    it('asks for none while the background is not see-through', () => {
        expect(shellGlass(false, 100)).toBe(0)
    })

    it('never asks for a negative blur', () => {
        expect(shellGlass(true, -20)).toBe(0)
    })
})
