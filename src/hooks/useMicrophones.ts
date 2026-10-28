import { useState, useEffect } from 'react'

export interface Microphone {
    deviceId: string
    label: string
}

export function useMicrophones() {
    const [microphones, setMicrophones] = useState<Microphone[]>([])

    useEffect(() => {
        const refresh = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const mics = devices
                    .filter((d) => d.kind === 'audioinput')
                    .map((d) => ({
                        deviceId: d.deviceId,
                        // Empty until access is granted; the UI shows a fallback
                        label: d.label,
                    }))
                setMicrophones(mics)
            } catch (e) {
                console.error('Error enumerando micrófonos:', e)
            }
        }

        const load = async () => {
            try {
                // Labels are only exposed once microphone access is granted
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                stream.getTracks().forEach((t) => t.stop())
            } catch (e) {
                console.error('Error accediendo al micrófono:', e)
            }
            await refresh()
        }

        load()
        // Pick up microphones plugged in or removed while the app is open
        navigator.mediaDevices.addEventListener('devicechange', refresh)
        return () => navigator.mediaDevices.removeEventListener('devicechange', refresh)
    }, [])

    // The recognizer always uses this one; Chromium lists it as "Default - <device>"
    const system = microphones.find((m) => m.deviceId === 'default') ?? microphones[0]
    const defaultMicrophone = system?.label.replace(/^[^-]+ - /, '') ?? ''

    return { microphones, defaultMicrophone }
}
