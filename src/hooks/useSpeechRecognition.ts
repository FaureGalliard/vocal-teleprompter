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
    onTranscript: (transcript: string) => void
    enabled: boolean
}

// The recognizer always listens to the system's default microphone. WebView2
// only offers cloud recognition, which answers "network" when fed a specific
// device's MediaStreamTrack, so choosing the input is left to Windows.
export function useSpeechRecognition({ language, onTranscript, enabled }: UseSpeechRecognitionProps) {
    const [listening, setListening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Latest words the recognizer heard, shown so the speaker can tell it works
    const [heard, setHeard] = useState('')
    const recognitionRef = useRef<SpeechRecognition | null>(null)
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
        setListening(false)
        setHeard('')
    }, [])

    const start = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) {
            setError('unsupported')
            return
        }
        const session = ++sessionRef.current
        setError(null)

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
            console.warn('Speech recognition error:', e.error)
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
                if (session === sessionRef.current) recognition.start()
            }, delay)
        }
        recognition.onresult = (event) => {
            setError(null)
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim()
                if (!transcript) continue
                setHeard(transcript)
                onTranscriptRef.current(transcript)
            }
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [language])

    useEffect(() => {
        if (enabled) start()
        else stop()
        return () => stop()
    }, [enabled, start, stop])

    return { listening, error, heard }
}
