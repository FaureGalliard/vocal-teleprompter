import { useState, useEffect } from 'react'

export interface Microphone {
    deviceId: string
    label: string
}

export function useMicrophones() {
    const [microphones, setMicrophones] = useState<Microphone[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
                const devices = await navigator.mediaDevices.enumerateDevices()
                const mics = devices
                    .filter((d) => d.kind === 'audioinput')
                    .map((d) => ({
                        deviceId: d.deviceId,
                        label: d.label || `Micrófono ${d.deviceId.slice(0, 6)}`,
                    }))
                setMicrophones(mics)
            } catch (e) {
                console.error('Error enumerando micrófonos:', e)
            }
        }
        load()
    }, [])

    return { microphones }
}
