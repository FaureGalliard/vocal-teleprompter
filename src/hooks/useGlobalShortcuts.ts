import { useEffect, useRef, useState } from 'react'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'

// System-wide shortcuts, so the prompter can be driven while Zoom, Meet or
// the slides have the focus. These are the defaults; each can be rebound.
export const GLOBAL_SHORTCUTS = {
    toggleListening: 'CommandOrControl+Alt+Space',
    nextCard: 'CommandOrControl+Alt+Right',
    previousCard: 'CommandOrControl+Alt+Left',
    toggleWindow: 'CommandOrControl+Alt+H',
    toggleClickThrough: 'CommandOrControl+Alt+K',
} as const

export type GlobalAction = keyof typeof GLOBAL_SHORTCUTS
export type ShortcutBindings = Record<GlobalAction, string>

interface UseGlobalShortcutsProps {
    handlers: Record<GlobalAction, () => void>
    bindings: ShortcutBindings
    enabled: boolean
}

// Registers the bindings while enabled and reports the ones the system
// refused, usually because another app already owns that combination
export function useGlobalShortcuts({ handlers, bindings, enabled }: UseGlobalShortcutsProps) {
    const [failed, setFailed] = useState<GlobalAction[]>([])
    // The latest handlers are read through the ref, so changing them does
    // not re-register anything
    const handlersRef = useRef(handlers)
    useEffect(() => {
        handlersRef.current = handlers
    })

    const key = enabled ? JSON.stringify(bindings) : ''

    useEffect(() => {
        if (!enabled) {
            setFailed([])
            return
        }
        const entries = Object.entries(bindings) as [GlobalAction, string][]
        const accelerators = entries.map(([, accelerator]) => accelerator)
        let cancelled = false

        const setup = async () => {
            // A previous run (other bindings, StrictMode, hot reload) may still hold them
            await unregister(accelerators).catch(() => {})
            if (cancelled) return
            const refused: GlobalAction[] = []
            // One registration per shortcut: the event reports the shortcut in a
            // normalized form that may not match the string registered
            for (const [action, accelerator] of entries) {
                await register(accelerator, (event) => {
                    if (event.state === 'Pressed') handlersRef.current[action]()
                }).catch((e) => {
                    console.error(`Could not register ${accelerator}:`, e)
                    refused.push(action)
                })
            }
            if (!cancelled) setFailed(refused)
        }
        setup()

        return () => {
            cancelled = true
            unregister(accelerators).catch(() => {})
        }
        // Re-register only when the bindings or the switch actually change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    return { failed }
}
