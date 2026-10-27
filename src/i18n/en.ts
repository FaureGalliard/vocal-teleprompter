export const en = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Welcome to Vocal Teleprompter. Press Start and read this text out loud: the prompter listens to you and follows your voice word by word. Pause whenever you want, speed up or slow down, and it will wait for you. Click any word to continue from there, or press Edit to write your own script. When you share your screen in Zoom or Meet, this window stays hidden from your audience.',

    toolbar: {
        paste: 'PASTE',
        import: 'IMPORT',
        clear: 'CLEAR',
        edit: 'EDIT',
        done: 'DONE',
        start: 'START',
        stop: 'STOP',
        pause: 'PAUSE',
        resume: 'RESUME',
        noMicrophones: 'No microphones',
        speechLanguage: 'Speech language',
        microphone: 'Microphone',
        size: 'Size',
        background: 'Background',
        text: 'Text',
        ok: 'OK',
    },

    settings: {
        title: 'Settings',
        interfaceLanguage: 'Interface language',
        hideFromCapture: 'Hide from screen sharing',
        hideFromCaptureHint: "Zoom, Meet, OBS and screenshots won't see this window",
        autoContrast: 'Automatic contrast',
        autoContrastHint: 'Adjusts the text color so it is always readable',
        titleBar: 'Show title bar',
        reset: 'Reset all settings',
        resetConfirm: 'Click again to reset',
        tutorial: 'Show tutorial',
    },

    tour: {
        next: 'Next',
        prev: 'Back',
        done: 'Done',
        welcomeTitle: 'Welcome',
        welcome: 'A quick tour of the prompter. It takes half a minute.',
        scriptTitle: 'Your script',
        script: 'Paste it, import a .txt file, or press Edit to write it right here.',
        startTitle: 'Start listening',
        start: 'Press Start (or Space) and read out loud. The text follows your voice.',
        languageTitle: 'Speech language',
        language: 'Pick the language you are going to speak in.',
        micTitle: 'Microphone',
        mic: 'Choose which microphone the prompter listens to.',
        lookTitle: 'Make it yours',
        look: 'Text size, background color and opacity, and text color.',
        settingsTitle: 'Settings',
        settings: 'Interface language, hiding from screen sharing, automatic contrast and more.',
        canvasTitle: 'Lost your place?',
        canvas: 'Click any word to continue from there. The arrow keys move word by word.',
        menuTitle: 'Toolbar',
        menu: 'Open or close this toolbar here. Hold the button to drag the window.',
    },

    cards: {
        label: (n: number) => `Slide ${n}`,
        position: (n: number, total: number) => `Slide ${n} / ${total}`,
        previous: 'Previous slide',
        next: 'Next slide',
        hint: 'Tip: a line with --- starts a new slide card',
    },

    titleBar: {
        moveDown: 'Move to the bottom',
        moveUp: 'Move to the top',
        minimize: 'Minimize',
        maximize: 'Maximize',
        close: 'Close',
    },

    tray: {
        show: 'Show',
        hide: 'Hide',
        quit: 'Quit',
    },

    canvas: {
        placeholder: 'Your text will appear here',
        editPlaceholder: 'Write or paste your script here…',
    },

    textFiles: 'Text',
    microphone: (id: string) => `Microphone ${id}`,

    errors: {
        unsupported: 'Speech recognition is not available',
        microphone: 'Could not access the microphone',
        'not-allowed': 'Microphone permission denied',
        'service-not-allowed': 'Speech service not allowed',
        'audio-capture': 'No microphone found',
        'language-not-supported': 'Language not supported',
        network: 'Network error, retrying…',
    } as Record<string, string>,
}

export type Messages = typeof en
