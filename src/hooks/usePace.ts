import { useState, useEffect } from 'react'

// Typical speaking rate, used to estimate a script's length before starting
export const DEFAULT_WPM = 130
// How far from the target position (share of the script) still counts as on pace
const PACE_TOLERANCE = 0.03

export type PaceStatus = 'on-pace' | 'speed-up' | 'slow-down'

interface UsePaceProps {
    running: boolean
    // A new session starts the clock from zero
    sessionActive: boolean
    spokenWords: number
    totalWords: number
    targetMinutes: number
}

export function usePace({
    running,
    sessionActive,
    spokenWords,
    totalWords,
    targetMinutes,
}: UsePaceProps) {
    const [elapsedMs, setElapsedMs] = useState(0)

    useEffect(() => {
        if (!sessionActive) setElapsedMs(0)
    }, [sessionActive])

    useEffect(() => {
        if (!running) return
        let last = Date.now()
        const id = setInterval(() => {
            const now = Date.now()
            setElapsedMs((v) => v + now - last)
            last = now
        }, 500)
        return () => clearInterval(id)
    }, [running])

    const minutes = elapsedMs / 60000
    // Too little data in the first seconds for a meaningful rate
    const wpm = elapsedMs > 10000 && spokenWords > 0 ? spokenWords / minutes : null
    const remainingMs =
        (totalWords - spokenWords) / (wpm ?? DEFAULT_WPM) * 60000

    let status: PaceStatus | null = null
    if (targetMinutes > 0 && elapsedMs > 10000 && totalWords > 0) {
        const expected = totalWords * Math.min(1, minutes / targetMinutes)
        const diff = (spokenWords - expected) / totalWords
        status = diff > PACE_TOLERANCE ? 'slow-down' : diff < -PACE_TOLERANCE ? 'speed-up' : 'on-pace'
    }

    return {
        elapsedMs,
        wpm,
        remainingMs: Math.max(0, remainingMs),
        status,
        estimatedMs: (totalWords / DEFAULT_WPM) * 60000,
    }
}

export function formatDuration(ms: number): string {
    const total = Math.round(ms / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}
