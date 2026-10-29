import { useEffect } from 'react'
import { useListeningSession } from './useListeningSession'
import { useMicrophones } from './useMicrophones'
import { usePace } from './usePace'
import type { useScript } from './useScript'
import type { Settings } from './useSettings'
import { useSpeechModel } from './useSpeechModel'
import { useSpeechRecognition } from './useSpeechRecognition'

// Everything between the microphone and the script: the speech model, the
// listening session, recognition and the speaker's pace
export function useSpeech({
    settings,
    script,
    onStart,
}: {
    settings: Settings
    script: ReturnType<typeof useScript>
    onStart: () => void
}) {
    const { language } = settings
    const { microphones, refresh: refreshMicrophones } = useMicrophones()
    // A remembered microphone may have been unplugged since last time
    const activeMic = microphones.some((m) => m.id === settings.selectedMic)
        ? settings.selectedMic
        : null

    const model = useSpeechModel(language)
    // Fetch a missing model as soon as its language is picked, not only on Start
    useEffect(() => {
        if (model.installed === false && !model.downloading && !model.failed) model.download()
        // Only when the language's model turns out to be missing
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model.installed])

    const session = useListeningSession({
        speechModel: model,
        countdownSeconds: settings.countdownSeconds,
        onStart,
    })
    const running = session.isSpeechActive && !session.isPaused
    const recognition = useSpeechRecognition({
        language,
        deviceId: activeMic,
        vocabulary: script.words,
        onTranscript: script.processTranscript,
        enabled: running,
    })
    const pace = usePace({
        running,
        sessionActive: session.isSpeechActive,
        spokenWords: script.currentWordIndex + 1,
        totalWords: script.words.length,
        targetMinutes: settings.targetMinutes,
    })

    return { microphones, refreshMicrophones, activeMic, model, session, recognition, pace }
}
