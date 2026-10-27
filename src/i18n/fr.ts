import type { Messages } from './en'

export const fr: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        "Bienvenue dans Vocal Teleprompter. Appuyez sur Démarrer et lisez ce texte à voix haute : le prompteur vous écoute et suit votre voix mot à mot. Faites une pause quand vous voulez, accélérez ou ralentissez, il vous attendra. Cliquez sur n'importe quel mot pour reprendre à partir de là, ou appuyez sur Modifier pour écrire votre propre texte. Quand vous partagez votre écran dans Zoom ou Meet, cette fenêtre reste invisible pour votre public.",

    toolbar: {
        paste: 'COLLER',
        import: 'IMPORTER',
        clear: 'EFFACER',
        edit: 'MODIFIER',
        done: 'TERMINÉ',
        start: 'DÉMARRER',
        stop: 'ARRÊTER',
        pause: 'PAUSE',
        resume: 'REPRENDRE',
        noMicrophones: 'Aucun microphone',
        size: 'Taille',
        background: 'Fond',
        text: 'Texte',
        ok: 'OK',
    },

    settings: {
        title: 'Paramètres',
        interfaceLanguage: "Langue de l'interface",
        hideFromCapture: "Masquer lors du partage d'écran",
        hideFromCaptureHint: "Zoom, Meet, OBS et les captures d'écran ne verront pas cette fenêtre",
        autoContrast: 'Contraste automatique',
        autoContrastHint: "Ajuste la couleur du texte pour qu'il reste toujours lisible",
        titleBar: 'Afficher la barre de titre',
        reset: 'Réinitialiser tous les paramètres',
        resetConfirm: 'Cliquez à nouveau pour réinitialiser',
    },

    titleBar: {
        moveDown: 'Déplacer en bas',
        moveUp: 'Déplacer en haut',
        minimize: 'Réduire',
        maximize: 'Agrandir',
        close: 'Fermer',
    },

    tray: {
        show: 'Afficher',
        hide: 'Masquer',
        quit: 'Quitter',
    },

    canvas: {
        placeholder: 'Votre texte apparaîtra ici',
        editPlaceholder: 'Écrivez ou collez votre texte ici…',
    },

    textFiles: 'Texte',
    microphone: (id: string) => `Microphone ${id}`,

    errors: {
        unsupported: "La reconnaissance vocale n'est pas disponible",
        microphone: "Impossible d'accéder au microphone",
        'not-allowed': 'Accès au microphone refusé',
        'service-not-allowed': 'Service vocal non autorisé',
        'audio-capture': 'Aucun microphone trouvé',
        'language-not-supported': 'Langue non prise en charge',
        network: 'Erreur réseau, nouvelle tentative…',
    },
}
