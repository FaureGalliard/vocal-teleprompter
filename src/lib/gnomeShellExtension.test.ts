// The GNOME Shell extension in linux/gnome-shell-extension, checked from here
// as it has no tests of its own and only loads after logging in again
import { describe, expect, it } from 'vitest'
import source from '../../linux/gnome-shell-extension/extension.js?raw'

const rust = Object.values(
    import.meta.glob<string>('../../src-tauri/src/*.rs', {
        query: '?raw',
        import: 'default',
        eager: true,
    }),
).join('\n')
const iface = source.slice(source.indexOf('const IFACE = `'), source.indexOf('</node>`'))
const declared = (kind: string) =>
    [...iface.matchAll(new RegExp(`<${kind} name="(\\w+)"`, 'g'))].map((m) => m[1])

describe('the GNOME Shell extension', () => {
    it('is valid JavaScript', () => {
        // Regression: backticks in a comment of the D-Bus interface, which is
        // a template literal, broke the whole extension after logging in.
        // Compiled without running it, its module lines aside.
        const body = source
            .replace(/^import .*$/gm, '')
            .replace(/^Gio\._promisify.*$/gm, '')
            .replace(/^export default /m, '')
        expect(() => new Function(body)).not.toThrow()
    })

    it('implements every method its D-Bus interface declares', () => {
        const methods = declared('method')
        expect(methods.length).toBeGreaterThan(0)
        for (const method of methods) expect(source).toMatch(new RegExp(`\\b${method}Async\\(`))
    })

    it('declares every method the app calls on it', () => {
        const called = [...rust.matchAll(/call\("(\w+)"/g)].map((m) => m[1])
        expect(called).toContain('BehindTop')
        for (const method of new Set(called)) expect(declared('method')).toContain(method)
    })
})
