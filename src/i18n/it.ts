import type { Messages } from './en'

export const it: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Benvenuto in Vocal Teleprompter. Premi Avvia e leggi questo testo ad alta voce: il gobbo ti ascolta e segue la tua voce parola per parola. Fai una pausa quando vuoi, accelera o rallenta, e ti aspetterà. Fai clic su qualsiasi parola per riprendere da lì, oppure premi Modifica per scrivere il tuo copione. Quando condividi lo schermo su Zoom o Meet, questa finestra resta nascosta al tuo pubblico.',

    toolbar: {
        paste: 'INCOLLA',
        import: 'IMPORTA',
        clear: 'CANCELLA',
        edit: 'MODIFICA',
        done: 'FATTO',
        start: 'AVVIA',
        stop: 'FERMA',
        pause: 'PAUSA',
        resume: 'RIPRENDI',
        noMicrophones: 'Nessun microfono',
        size: 'Dimensione',
        background: 'Sfondo',
        text: 'Testo',
        ok: 'OK',
    },

    settings: {
        title: 'Impostazioni',
        interfaceLanguage: "Lingua dell'interfaccia",
        hideFromCapture: 'Nascondi durante la condivisione',
        hideFromCaptureHint: 'Zoom, Meet, OBS e gli screenshot non vedranno questa finestra',
        autoContrast: 'Contrasto automatico',
        autoContrastHint: 'Regola il colore del testo perché sia sempre leggibile',
        titleBar: 'Mostra barra del titolo',
        reset: 'Ripristina tutte le impostazioni',
        resetConfirm: 'Fai clic di nuovo per ripristinare',
    },

    titleBar: {
        moveDown: 'Sposta in basso',
        moveUp: 'Sposta in alto',
        minimize: 'Riduci a icona',
        maximize: 'Ingrandisci',
        close: 'Chiudi',
    },

    tray: {
        show: 'Mostra',
        hide: 'Nascondi',
        quit: 'Esci',
    },

    canvas: {
        placeholder: 'Il tuo testo apparirà qui',
        editPlaceholder: 'Scrivi o incolla qui il tuo copione…',
    },

    textFiles: 'Testo',
    microphone: (id: string) => `Microfono ${id}`,

    errors: {
        unsupported: 'Riconoscimento vocale non disponibile',
        microphone: 'Impossibile accedere al microfono',
        'not-allowed': 'Accesso al microfono negato',
        'service-not-allowed': 'Servizio vocale non consentito',
        'audio-capture': 'Nessun microfono trovato',
        'language-not-supported': 'Lingua non supportata',
        network: 'Errore di rete, nuovo tentativo…',
    },
}
