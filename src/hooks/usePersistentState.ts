import { useState, useEffect } from 'react'

const PREFIX = 'vocal-teleprompter:'

export function loadPersistent<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + key)
        return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
        return fallback
    }
}

export function savePersistent<T>(key: string, value: T) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
        // Storage full or unavailable: keep working with in-memory state
    }
}

// Forget every saved setting (the caller reloads to apply the defaults)
export function clearPersistentState() {
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(PREFIX))
            .forEach((k) => localStorage.removeItem(k))
    } catch {
        // Nothing saved to clear
    }
}

// useState that survives restarts by mirroring the value into localStorage
export function usePersistentState<T>(key: string, fallback: T) {
    const [value, setValue] = useState<T>(() => loadPersistent(key, fallback))

    useEffect(() => savePersistent(key, value), [key, value])

    return [value, setValue] as const
}
