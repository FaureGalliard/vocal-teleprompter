import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

export interface Microphone {
    id: string
    name: string
    isDefault: boolean
}

// Input devices as the native audio layer sees them, so any of them can be
// used for speech recognition
export function useMicrophones() {
    const [microphones, setMicrophones] = useState<Microphone[]>([])

    const refresh = useCallback(() => {
        invoke<Microphone[]>('list_microphones')
            .then(setMicrophones)
            .catch((e) => console.error('Could not list microphones:', e))
    }, [])

    useEffect(() => {
        refresh()
        // Pick up microphones plugged in or removed while the app is open
        navigator.mediaDevices?.addEventListener('devicechange', refresh)
        return () => navigator.mediaDevices?.removeEventListener('devicechange', refresh)
    }, [refresh])

    return { microphones, refresh }
}
