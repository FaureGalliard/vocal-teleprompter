import { useEffect, useRef } from 'react'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'

// System-wide shortcuts, so the prompter can be driven while Zoom, Meet or
// the slides have the focus
export const GLOBAL_SHORTCUTS = {
    toggleListening: 'CommandOrControl+Alt+Space',
    nextCard: 'CommandOrControl+Alt+Right',
    previousCard: 'CommandOrControl+Alt+Left',
    toggleWindow: 'CommandOrControl+Alt+H',
} as const

export type GlobalAction = keyof typeof GLOBAL_SHORTCUTS

export function useGlobalShortcuts(handlers: Record<GlobalAction, () => void>) {
    // Registered once; the latest handlers are read through the ref
    const handlersRef = useRef(handlers)
    useEffect(() => {
        handlersRef.current = handlers
    })

    useEffect(() => {
        const entries = Object.entries(GLOBAL_SHORTCUTS) as [GlobalAction, string][]
        const accelerators = entries.map(([, accelerator]) => accelerator)
        let cancelled = false

        const setup = async () => {
            // A previous mount (StrictMode, hot reload) may still hold them
            await unregister(accelerators).catch(() => {})
            if (cancelled) return
            // One registration per shortcut: the event reports the shortcut in a
            // normalized form that may not match the string registered
            for (const [action, accelerator] of entries) {
                await register(accelerator, (event) => {
                    if (event.state === 'Pressed') handlersRef.current[action]()
                }).catch((e) => console.error(`Could not register ${accelerator}:`, e))
            }
        }
        setup()

        return () => {
            cancelled = true
            unregister(accelerators).catch(() => {})
        }
    }, [])
}
