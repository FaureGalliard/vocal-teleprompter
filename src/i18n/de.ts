import type { Messages } from './en'

export const de: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Willkommen bei Vocal Teleprompter. Drücke auf Starten und lies diesen Text laut vor: Der Prompter hört dir zu und folgt deiner Stimme Wort für Wort. Mach Pausen, wann du willst, sprich schneller oder langsamer, er wartet auf dich. Klicke auf ein beliebiges Wort, um dort weiterzumachen, oder drücke auf Bearbeiten, um dein eigenes Skript zu schreiben. Wenn du deinen Bildschirm in Zoom oder Meet teilst, bleibt dieses Fenster für dein Publikum unsichtbar.',

    toolbar: {
        more: 'Skript und Hilfe',
        editScript: 'Skript bearbeiten',
        finishEditing: 'Bearbeitung beenden',
        pasteScript: 'Aus Zwischenablage einfügen',
        importScript: '.txt-Datei importieren',
        clearScript: 'Skript leeren',
        start: 'STARTEN',
        stop: 'STOPPEN',
        pause: 'PAUSE',
        resume: 'FORTSETZEN',
        noMicrophones: 'Keine Mikrofone',
        speechLanguage: 'Sprache der Spracheingabe',
        microphone: 'Mikrofon',
        size: 'Größe',
        background: 'Hintergrund',
        text: 'Text',
    },

    settings: {
        title: 'Einstellungen',
        interfaceLanguage: 'Sprache der Oberfläche',
        hideFromCapture: 'Bei Bildschirmfreigabe ausblenden',
        hideFromCaptureHint: 'Zoom, Meet, OBS und Screenshots sehen dieses Fenster nicht',
        autoContrast: 'Automatischer Kontrast',
        autoContrastHint: 'Passt die Textfarbe an, damit sie immer lesbar ist',
        titleBar: 'Titelleiste anzeigen',
        reset: 'Alle Einstellungen zurücksetzen',
        resetConfirm: 'Zum Zurücksetzen erneut klicken',
        tutorial: 'Tutorial anzeigen',
        targetDuration: 'Zieldauer',
        targetDurationHint: 'Sagt dir, ob du schneller oder langsamer sprechen sollst. 0 = aus',
        readingLine: 'Leselinie',
        readingLineHint: 'Hält die aktuelle Zeile oben, nah an deiner Kamera',
        clickThrough: 'Klicks durchlassen',
        clickThroughHint: (keys: string) =>
            `Klicks gehen an die App dahinter. Ausschalten mit ${keys} oder über das Tray-Symbol`,
        countdown: 'Countdown',
        countdownHint: 'Sekunden zum Bereitmachen, bevor das Zuhören beginnt',
        countdownOff: 'Aus',
        sectionReading: 'Lesen',
        sectionWindow: 'Fenster',
        sectionGeneral: 'Allgemein',
    },

    tour: {
        next: 'Weiter',
        prev: 'Zurück',
        done: 'Fertig',
        welcomeTitle: 'Willkommen',
        welcome: 'Eine kurze Tour durch den Prompter. Sie dauert eine halbe Minute.',
        scriptTitle: 'Dein Skript',
        script: 'In diesem Menü kannst du dein Skript bearbeiten, einfügen, importieren oder leeren.',
        startTitle: 'Zuhören starten',
        start: 'Drücke auf Starten (oder die Leertaste) und lies laut vor. Der Text folgt deiner Stimme.',
        languageTitle: 'Sprache der Spracheingabe',
        language: 'Wähle die Sprache, in der du sprechen wirst.',
        micTitle: 'Mikrofon',
        mic: 'Wähle das Mikrofon, auf das er hört, und prüfe den Pegel.',
        lookTitle: 'Mach es dir passend',
        look: 'Textgröße, Farben, automatischer Kontrast und Typografie.',
        settingsTitle: 'Einstellungen',
        settings:
            'Wie der Text scrollt, Countdown, Ausblenden bei Bildschirmfreigabe, Sprache der Oberfläche und mehr.',
        canvasTitle: 'Bearbeiten oder springen',
        canvas: 'Klicke auf ein Wort, um ab dort weiterzulesen. Klicke es erneut an, oder klicke zwischen zwei Wörter, um das Skript genau dort zu bearbeiten.',
        menuTitle: 'Werkzeugleiste',
        menu: 'Öffne oder schließe die Leiste hier. Halte die Taste gedrückt, um das Fenster zu verschieben.',
    },

    cards: {
        position: (n: number, total: number) => `Folie ${n} / ${total}`,
        previous: 'Vorherige Folie',
        next: 'Nächste Folie',
        hint: 'Tipp: Eine Zeile mit --- beginnt eine neue Folienkarte',
    },

    pace: {
        wpm: (n: number) => `${n} W/min`,
        left: (time: string) => `noch ${time}`,
        estimate: (time: string) => `≈ ${time} Lesezeit`,
        target: (time: string) => `Ziel ${time}`,
        'on-pace': 'Gutes Tempo',
        'speed-up': 'Schneller',
        'slow-down': 'Langsamer',
    },

    shortcuts: {
        title: 'Globale Tastenkürzel',
        toggleListening: 'Starten / pausieren',
        nextCard: 'Nächste Folie',
        previousCard: 'Vorherige Folie',
        toggleWindow: 'Fenster ein- / ausblenden',
        toggleClickThrough: 'Klicks durchlassen ein / aus',
        change: 'Klicken, dann die neue Kombination drücken',
        pressKeys: 'Tasten drücken…',
        taken: (action: string) => `Bereits belegt durch „${action}“`,
        unavailable: 'Eine andere App nutzt diese Kombination; wähle eine andere',
        resetDefaults: 'Standard-Tastenkürzel wiederherstellen',
    },

    statusBar: {
        clickThroughOn: 'Klicks durchlassen',
    },

    updates: {
        available: (v: string) => `Version ${v} ist verfügbar`,
        install: 'Jetzt aktualisieren',
        installVersion: (v: string) => `${v} installieren`,
        later: 'Später',
        downloading: (p: number) => `Update wird geladen… ${p}%`,
        check: 'Nach Updates suchen',
        checking: 'Wird gesucht…',
        upToDate: 'Du bist auf dem neuesten Stand',
        failed: 'Suche nach Updates fehlgeschlagen',
        autoCheck: 'Automatisch nach Updates suchen',
        version: (v: string) => `Version ${v}`,
    },

    typography: {
        title: 'Typografie',
        fonts: {
            sans: 'Sans',
            serif: 'Serif',
            mono: 'Mono',
            rounded: 'Rund',
            legible: 'Gut lesbar',
        },
        weights: { 400: 'Normal', 600: 'Halbfett', 700: 'Fett' },
        lineHeight: 'Zeilenabstand',
        width: 'Textbreite',
        alignCenter: 'Zentriert',
        alignLeft: 'Linksbündig',
        reset: 'Standardwerte',
    },

    ai: {
        title: 'KI-Connector (MCP)',
        hint: 'Lass Claude und andere KI-Assistenten dein Skript schreiben und hier laden',
        connect: 'Verbinden',
        connected: 'Verbunden',
        copy: 'Konfiguration für eine andere App kopieren',
        copied: 'Kopiert',
        restart: (app: string) => `Fertig. Starte ${app} neu, um ihn zu nutzen`,
    },

    appearance: {
        title: 'Darstellung',
        opacity: 'Deckkraft des Hintergrunds',
    },

    mic: {
        title: 'Verwendetes Mikrofon',
        level: 'Eingangspegel: sprich, um es zu testen',
        hint: 'Die Spracherkennung hört immer auf das Standardmikrofon von Windows. Um ein anderes zu nutzen, ändere es in Windows.',
        change: 'In Windows ändern',
        heard: 'Was der Prompter hört',
        systemDefault: 'Systemstandard',
    },

    speechModel: {
        failed: 'Das Sprachmodell konnte nicht geladen werden. Prüfe die Verbindung und drücke erneut auf Starten',
        title: (language: string) => `Sprachmodell wird geladen: ${language}`,
        hint: 'Wird einmal benötigt, um diese Sprache zu verstehen. Der Prompter hört zu, sobald es bereit ist.',
        failedTitle: 'Das Sprachmodell wurde nicht geladen',
        retry: 'Erneut versuchen',
        waiting: 'Warte auf das Sprachmodell…',
    },

    scrolling: {
        title: 'Bildlauf',
        ahead: 'Zeilen darunter',
        fixed: 'Feste Zeile',
        aheadHint:
            'Der Text bleibt stehen und rückt nur nach, damit unten einige Zeilen sichtbar bleiben',
        fixedHint: 'Die gelesene Zeile bleibt auf gleicher Höhe',
        linesBelow: 'Zeilen darunter',
        position: 'Position der Zeile',
    },

    titleBar: {
        moveDown: 'Nach unten verschieben',
        moveUp: 'Nach oben verschieben',
        minimize: 'Minimieren',
        maximize: 'Maximieren',
        close: 'Schließen',
    },

    tray: {
        show: 'Anzeigen',
        hide: 'Ausblenden',
        quit: 'Beenden',
        clickThrough: 'Klicks durchlassen ein/aus',
    },

    canvas: {
        placeholder: 'Dein Text erscheint hier',
        editPlaceholder: 'Schreibe oder füge dein Skript hier ein…',
    },

    textFiles: 'Text',
    microphone: (id: string) => `Mikrofon ${id}`,

    errors: {
        unsupported: 'Spracherkennung ist nicht verfügbar',
        microphone: 'Kein Zugriff auf das Mikrofon',
        'not-allowed': 'Mikrofonzugriff verweigert',
        'service-not-allowed': 'Sprachdienst nicht erlaubt',
        'audio-capture': 'Kein Mikrofon gefunden',
        'language-not-supported': 'Sprache wird nicht unterstützt',
        network: 'Netzwerkfehler, neuer Versuch…',
        'model-missing': 'Das Sprachmodell für diese Sprache ist noch nicht installiert',
        'model-unreadable':
            'Das Sprachmodell konnte nicht geladen werden; lösche es und lade es neu',
        'microphone-unavailable': 'Dieses Mikrofon ist nicht verfügbar; wähle ein anderes',
    },
}
