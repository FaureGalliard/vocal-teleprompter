import { useState, useEffect } from 'react'

const PREFIX = 'vocal-teleprompter:'

function load<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + key)
        return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
        return fallback
    }
}

// useState that survives restarts by mirroring the value into localStorage
export function usePersistentState<T>(key: string, fallback: T) {
    const [value, setValue] = useState<T>(() => load(key, fallback))

    useEffect(() => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value))
        } catch {
            // Storage full or unavailable: keep working with in-memory state
        }
    }, [key, value])

    return [value, setValue] as const
}
