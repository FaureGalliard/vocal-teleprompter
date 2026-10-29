import { useEffect, useRef, useState } from 'react'
import type { useSpeechModel } from './useSpeechModel'

// Whether the prompter is listening, paused or counting down to start
export function useListeningSession({
    speechModel,
    countdownSeconds,
    onStart,
}: {
    speechModel: ReturnType<typeof useSpeechModel>
    countdownSeconds: number
    // Listening and editing exclude each other: the script must hold still
    onStart: () => void
}) {
    const [isSpeechActive, setIsSpeechActive] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [countdown, setCountdown] = useState<number | null>(null)
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const cancelCountdown = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
        setCountdown(null)
    }

    useEffect(() => cancelCountdown, [])

    // Start a fresh session, after the countdown when one is set. Resuming from
    // a pause goes through setIsPaused instead and skips it.
    const startListening = async () => {
        if (countdownTimerRef.current || speechModel.downloading) return
        // The first time in a language, fetch its speech model, then go on
        if (speechModel.installed !== true && !(await speechModel.download())) return
        onStart()
        setIsPaused(false)
        if (countdownSeconds <= 0) {
            setIsSpeechActive(true)
            return
        }
        let left = countdownSeconds
        setCountdown(left)
        countdownTimerRef.current = setInterval(() => {
            left -= 1
            if (left > 0) {
                setCountdown(left)
                return
            }
            cancelCountdown()
            setIsSpeechActive(true)
        }, 1000)
    }

    const stopListening = () => {
        cancelCountdown()
        setIsSpeechActive(false)
        setIsPaused(false)
    }

    // Space and the global shortcut: start, or pause and resume once started
    const toggleListening = () => {
        if (isSpeechActive) setIsPaused((v) => !v)
        else if (countdown !== null) cancelCountdown()
        else startListening()
    }

    return {
        isSpeechActive,
        isPaused,
        setIsPaused,
        countdown,
        startListening,
        stopListening,
        cancelCountdown,
        toggleListening,
    }
}
