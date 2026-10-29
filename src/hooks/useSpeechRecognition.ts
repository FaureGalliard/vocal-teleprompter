import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface UseSpeechRecognitionProps {
    language: string
    // Microphone to listen to; null for the system default
    deviceId: string | null
    // Words of the script; the recognizer only listens for these
    vocabulary: string[]
    onTranscript: (transcript: string) => void
    enabled: boolean
}

interface SpeechEvent {
    text: string
    isFinal: boolean
}

// Speech recognition runs natively (Vosk, see src-tauri/src/speech) on the
// chosen microphone and reports the text of the current utterance as it
// grows, which is what the script matcher expects.
export function useSpeechRecognition({
    language,
    deviceId,
    vocabulary,
    onTranscript,
    enabled,
}: UseSpeechRecognitionProps) {
    // Restart only when the words themselves change, not on every render
    const vocabularyKey = vocabulary.join(' ')
    const [listening, setListening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Latest words the recognizer heard, shown so the speaker can tell it works
    const [heard, setHeard] = useState('')

    // Read the latest callback instead of the one captured when listening began
    const onTranscriptRef = useRef(onTranscript)
    useEffect(() => {
        onTranscriptRef.current = onTranscript
    }, [onTranscript])

    useEffect(() => {
        const unlisten = listen<SpeechEvent>('speech', ({ payload }) => {
            setHeard(payload.text)
            onTranscriptRef.current(payload.text)
        })
        return () => {
            unlisten.then((off) => off())
        }
    }, [])

    useEffect(() => {
        if (!enabled) {
            setListening(false)
            setHeard('')
            invoke('speech_stop').catch(() => {})
            return
        }
        let cancelled = false
        setError(null)
        invoke('speech_start', {
            language,
            deviceId,
            vocabulary: vocabularyKey.split(' ').filter(Boolean),
        })
            .then(() => !cancelled && setListening(true))
            .catch((e) => {
                if (cancelled) return
                console.warn('Speech recognition could not start:', e)
                setError(String(e))
                setListening(false)
            })
        return () => {
            cancelled = true
        }
    }, [enabled, language, deviceId, vocabularyKey])

    // Release the microphone when the app closes the hook for good
    useEffect(() => () => void invoke('speech_stop').catch(() => {}), [])

    return { listening, error, heard }
}
