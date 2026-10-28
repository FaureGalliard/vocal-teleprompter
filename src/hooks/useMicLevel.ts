import { useState, useEffect } from 'react'

// Live input level (0 to 1) of the system's default microphone while active,
// to show whether the microphone the recognizer uses actually hears anything
export function useMicLevel(active: boolean) {
    const [level, setLevel] = useState(0)

    useEffect(() => {
        if (!active) {
            setLevel(0)
            return
        }
        let stream: MediaStream | null = null
        let context: AudioContext | null = null
        let frame = 0
        let cancelled = false

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((s) => {
                if (cancelled) {
                    s.getTracks().forEach((t) => t.stop())
                    return
                }
                stream = s
                context = new AudioContext()
                const analyser = context.createAnalyser()
                analyser.fftSize = 512
                context.createMediaStreamSource(s).connect(analyser)
                const samples = new Float32Array(analyser.fftSize)
                const tick = () => {
                    analyser.getFloatTimeDomainData(samples)
                    let sum = 0
                    for (const v of samples) sum += v * v
                    // RMS scaled so normal speech fills most of the meter
                    setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 6))
                    frame = requestAnimationFrame(tick)
                }
                tick()
            })
            .catch(() => setLevel(0))

        return () => {
            cancelled = true
            cancelAnimationFrame(frame)
            stream?.getTracks().forEach((t) => t.stop())
            context?.close().catch(() => {})
        }
    }, [active])

    return level
}
