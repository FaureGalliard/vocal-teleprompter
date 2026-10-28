import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// Live input level (0 to 1) of a microphone. While listening the speech
// engine already reports it; otherwise `monitor` opens the microphone just to
// measure, e.g. while the microphone menu is open.
export function useMicLevel(monitor: boolean, listening: boolean, deviceId: string | null) {
    const [level, setLevel] = useState(0)

    useEffect(() => {
        const unlisten = listen<number>('mic-level', ({ payload }) => setLevel(payload))
        return () => {
            unlisten.then((off) => off())
        }
    }, [])

    useEffect(() => {
        if (!monitor || listening) return
        invoke('mic_monitor_start', { deviceId }).catch((e) => console.warn(e))
        return () => {
            invoke('speech_stop').catch(() => {})
            setLevel(0)
        }
    }, [monitor, listening, deviceId])

    useEffect(() => {
        if (!monitor && !listening) setLevel(0)
    }, [monitor, listening])

    return level
}
