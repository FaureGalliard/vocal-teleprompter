import type { Messages } from './en'

export const de: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Willkommen bei Vocal Teleprompter. Drücke auf Starten und lies diesen Text laut vor: Der Prompter hört dir zu und folgt deiner Stimme Wort für Wort. Mach Pausen, wann du willst, sprich schneller oder langsamer, er wartet auf dich. Klicke auf ein beliebiges Wort, um dort weiterzumachen, oder drücke auf Bearbeiten, um dein eigenes Skript zu schreiben. Wenn du deinen Bildschirm in Zoom oder Meet teilst, bleibt dieses Fenster für dein Publikum unsichtbar.',

    toolbar: {
        paste: 'EINFÜGEN',
        import: 'IMPORTIEREN',
        clear: 'LEEREN',
        edit: 'BEARBEITEN',
        done: 'FERTIG',
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
        ok: 'OK',
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
        clickThroughHint: (keys: string) => `Klicks gehen an die App dahinter. Ausschalten mit ${keys} oder über das Tray-Symbol`,
    },

    tour: {
        next: 'Weiter',
        prev: 'Zurück',
        done: 'Fertig',
        welcomeTitle: 'Willkommen',
        welcome: 'Eine kurze Tour durch den Prompter. Sie dauert eine halbe Minute.',
        scriptTitle: 'Dein Skript',
        script: 'Füge es ein, importiere eine .txt-Datei oder drücke auf Bearbeiten, um es direkt hier zu schreiben.',
        startTitle: 'Zuhören starten',
        start: 'Drücke auf Starten (oder die Leertaste) und lies laut vor. Der Text folgt deiner Stimme.',
        languageTitle: 'Sprache der Spracheingabe',
        language: 'Wähle die Sprache, in der du sprechen wirst.',
        micTitle: 'Mikrofon',
        mic: 'Wähle, welchem Mikrofon der Prompter zuhört.',
        lookTitle: 'Mach es dir passend',
        look: 'Textgröße, Hintergrundfarbe und Deckkraft sowie Textfarbe.',
        settingsTitle: 'Einstellungen',
        settings: 'Sprache der Oberfläche, Ausblenden bei Bildschirmfreigabe, automatischer Kontrast und mehr.',
        canvasTitle: 'Bearbeiten oder springen',
        canvas: 'Klicke auf ein Wort, um das Skript genau dort zu bearbeiten. Mit Strg+Klick (oder einem Klick beim Zuhören) liest du ab diesem Wort weiter.',
        menuTitle: 'Werkzeugleiste',
        menu: 'Öffne oder schließe diese Leiste hier. Halte die Taste gedrückt, um das Fenster zu verschieben.',
    },

    cards: {
        label: (n: number) => `Folie ${n}`,
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
    },
}
