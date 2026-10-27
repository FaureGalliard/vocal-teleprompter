import { useEffect, useRef, useState, useCallback } from 'react'

// Errors the recognizer cannot recover from by restarting
const FATAL_ERRORS = new Set([
    'not-allowed',
    'service-not-allowed',
    'audio-capture',
    'language-not-supported',
])
// Errors that only mean "nothing heard yet" and are not worth showing
const SILENT_ERRORS = new Set(['aborted', 'no-speech'])
const RESTART_DELAY_MS = 1000

interface UseSpeechRecognitionProps {
    language: string
    deviceId: string
    onTranscript: (transcript: string) => void
    enabled: boolean
}

export function useSpeechRecognition({
    language,
    deviceId,
    onTranscript,
    enabled,
}: UseSpeechRecognitionProps) {
    const [listening, setListening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const enabledRef = useRef(enabled)
    const sessionRef = useRef(0)
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // The recognizer lives across renders, so read the latest callback
    // instead of the one captured when it started
    const onTranscriptRef = useRef(onTranscript)

    useEffect(() => {
        enabledRef.current = enabled
    }, [enabled])

    useEffect(() => {
        onTranscriptRef.current = onTranscript
    }, [onTranscript])

    const stop = useCallback(() => {
        sessionRef.current++
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current)
            restartTimerRef.current = null
        }
        if (recognitionRef.current) {
            recognitionRef.current.onend = null
            recognitionRef.current.stop()
            recognitionRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        setListening(false)
    }, [])

    const start = useCallback(async () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) {
            setError('unsupported')
            return
        }
        const session = ++sessionRef.current
        setError(null)

        let track: MediaStreamTrack | undefined
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
            })
            // stop() ran while we waited for the device
            if (session !== sessionRef.current) {
                stream.getTracks().forEach((t) => t.stop())
                return
            }
            streamRef.current = stream
            track = stream.getAudioTracks()[0]
        } catch (e) {
            setError('microphone')
            return
        }

        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language
        recognition.maxAlternatives = 1

        let fatal = false
        let failed = false

        recognition.onstart = () => setListening(true)
        recognition.onerror = (e) => {
            if (SILENT_ERRORS.has(e.error)) return
            setError(e.error)
            if (FATAL_ERRORS.has(e.error)) fatal = true
            else failed = true
        }
        recognition.onend = () => {
            setListening(false)
            if (!enabledRef.current || fatal || session !== sessionRef.current) return
            // Back off after a real failure (e.g. network) instead of spinning
            const delay = failed ? RESTART_DELAY_MS : 0
            failed = false
            restartTimerRef.current = setTimeout(() => {
                restartTimerRef.current = null
                if (session === sessionRef.current) recognition.start(track)
            }, delay)
        }
        recognition.onresult = (event) => {
            setError(null)
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim()
                if (transcript) onTranscriptRef.current(transcript)
            }
        }

        recognitionRef.current = recognition
        // Chromium feeds the recognizer from the given track; older engines
        // ignore the argument and fall back to the default microphone.
        recognition.start(track)
    }, [language, deviceId])

    useEffect(() => {
        if (enabled) start()
        else stop()
        return () => stop()
    }, [enabled, start, stop])

    return { listening, error }
}
