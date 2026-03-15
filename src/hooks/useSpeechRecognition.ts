import { useEffect, useRef, useState, useCallback } from 'react'

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

    useEffect(() => {
        enabledRef.current = enabled
    }, [enabled])

    const stop = useCallback(() => {
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
            setError('Speech Recognition no disponible')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
            })
            streamRef.current = stream
        } catch (e) {
            setError('No se pudo acceder al micrófono')
            return
        }

        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language
        recognition.maxAlternatives = 1

        recognition.onstart = () => setListening(true)
        recognition.onerror = (e) => {
            if (e.error !== 'aborted') setError(e.error)
        }
        recognition.onend = () => {
            if (enabledRef.current) recognition.start()
            else setListening(false)
        }
        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim()
                if (transcript) onTranscript(transcript)
            }
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [language, deviceId, onTranscript])

    useEffect(() => {
        if (enabled) start()
        else stop()
        return () => stop()
    }, [enabled, language, deviceId])

    return { listening, error }
}
