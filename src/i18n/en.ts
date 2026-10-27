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
