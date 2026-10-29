export const en = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Welcome to Vocal Teleprompter. Press Start and read this text out loud: the prompter listens to you and follows your voice word by word. Pause whenever you want, speed up or slow down, and it will wait for you. Click any word to continue from there, or press Edit to write your own script. When you share your screen in Zoom or Meet, this window stays hidden from your audience.',

    toolbar: {
        more: 'Script and help',
        editScript: 'Edit script',
        finishEditing: 'Finish editing',
        pasteScript: 'Paste from clipboard',
        importScript: 'Import a .txt file',
        clearScript: 'Clear script',
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
        targetDuration: 'Target duration',
        targetDurationHint: 'Tells you to speed up or slow down. 0 = off',
        readingLine: 'Reading line',
        readingLineHint: 'Keeps the current line near the top, close to your camera',
        clickThrough: 'Click-through',
        clickThroughHint: (keys: string) => `Clicks go to the app behind. Turn off with ${keys} or the tray icon`,
        countdown: 'Countdown',
        countdownHint: 'Seconds to get ready before listening starts',
        countdownOff: 'Off',
        sectionReading: 'Reading',
        sectionWindow: 'Window',
        sectionGeneral: 'General',
    },

    tour: {
        next: 'Next',
        prev: 'Back',
        done: 'Done',
        welcomeTitle: 'Welcome',
        welcome: 'A quick tour of the prompter. It takes half a minute.',
        scriptTitle: 'Your script',
        script: 'Edit, paste, import or clear your script from this menu.',
        startTitle: 'Start listening',
        start: 'Press Start (or Space) and read out loud. The text follows your voice.',
        languageTitle: 'Speech language',
        language: 'Pick the language you are going to speak in.',
        micTitle: 'Microphone',
        mic: 'Choose which microphone to listen to, and check its level.',
        lookTitle: 'Make it yours',
        look: 'Text size, colors, automatic contrast and typography.',
        settingsTitle: 'Settings',
        settings: 'How the text scrolls, the countdown, hiding from screen sharing, interface language and more.',
        canvasTitle: 'Edit or jump',
        canvas: 'Click a word to continue reading from it. Click it again, or click between words, to edit the script right there.',
        menuTitle: 'Toolbar',
        menu: 'Open or close the toolbar here. Hold the button to drag the window.',
    },

    cards: {
        position: (n: number, total: number) => `Slide ${n} / ${total}`,
        previous: 'Previous slide',
        next: 'Next slide',
        hint: 'Tip: a line with --- starts a new slide card',
    },

    pace: {
        wpm: (n: number) => `${n} wpm`,
        left: (time: string) => `${time} left`,
        estimate: (time: string) => `≈ ${time} to read`,
        target: (time: string) => `target ${time}`,
        'on-pace': 'On pace',
        'speed-up': 'Speed up',
        'slow-down': 'Slow down',
    },

    shortcuts: {
        title: 'Global shortcuts',
        toggleListening: 'Start / pause',
        nextCard: 'Next slide',
        previousCard: 'Previous slide',
        toggleWindow: 'Show / hide window',
        toggleClickThrough: 'Click-through on / off',
        change: 'Click, then press the new combination',
        pressKeys: 'Press keys…',
        taken: (action: string) => `Already used by “${action}”`,
        unavailable: 'Another app is using this combination; pick a different one',
        resetDefaults: 'Restore default shortcuts',
    },

    statusBar: {
        clickThroughOn: 'Click-through',
    },

    updates: {
        available: (v: string) => `Version ${v} is available`,
        install: 'Update now',
        installVersion: (v: string) => `Install ${v}`,
        later: 'Later',
        downloading: (p: number) => `Downloading update… ${p}%`,
        check: 'Check for updates',
        checking: 'Checking…',
        upToDate: "You're up to date",
        failed: "Couldn't check for updates",
        autoCheck: 'Check for updates automatically',
        version: (v: string) => `Version ${v}`,
    },

    typography: {
        title: 'Typography',
        fonts: { sans: 'Sans', serif: 'Serif', mono: 'Mono', rounded: 'Rounded', legible: 'Legible' },
        weights: { 400: 'Regular', 600: 'Semibold', 700: 'Bold' },
        lineHeight: 'Line spacing',
        width: 'Text width',
        alignCenter: 'Centered',
        alignLeft: 'Left aligned',
        reset: 'Restore defaults',
    },

    ai: {
        title: 'AI connector (MCP)',
        hint: 'Let Claude and other AI assistants write your script and load it here',
        connect: 'Connect',
        connected: 'Connected',
        copy: 'Copy the config for another app',
        copied: 'Copied',
        restart: (app: string) => `Done. Restart ${app} to use it`,
    },

    appearance: {
        title: 'Appearance',
        opacity: 'Background opacity',
    },

    mic: {
        title: 'Microphone in use',
        level: 'Input level: speak to test it',
        hint: 'Speech recognition always listens to the Windows default microphone. To use another one, change the default in Windows.',
        change: 'Change in Windows',
        heard: 'What the prompter hears',
        systemDefault: 'System default',
    },

    speechModel: {
        failed: "Couldn't download the speech model. Check your connection and press Start again",
        title: (language: string) => `Downloading the ${language} speech model`,
        hint: 'Needed once to understand this language. The prompter starts listening as soon as it is ready.',
        failedTitle: 'The speech model did not download',
        retry: 'Try again',
        waiting: 'Waiting for the speech model…',
    },

    scrolling: {
        title: 'Scrolling',
        ahead: 'Lines below',
        fixed: 'Fixed line',
        aheadHint: 'The text stays put and only moves to keep a few lines visible below you',
        fixedHint: 'The line you are reading stays at the same height',
        linesBelow: 'Lines kept below',
        position: 'Line position',
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
        clickThrough: 'Toggle click-through',
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
        'model-missing': 'The speech model for this language is not installed yet',
        'model-unreadable': 'The speech model could not be loaded; delete it and download it again',
        'microphone-unavailable': 'That microphone is not available; pick another one',
    } as Record<string, string>,
}

export type Messages = typeof en
