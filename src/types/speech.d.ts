interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    start(): void
    stop(): void
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null
    onend: ((this: SpeechRecognition, ev: Event) => void) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    isFinal: boolean
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

declare var SpeechRecognition: {
    new (): SpeechRecognition
}

declare var webkitSpeechRecognition: {
    new (): SpeechRecognition
}

interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof webkitSpeechRecognition
}
