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
        speechLanguage: 'Langue parlée',
        microphone: 'Microphone',
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
        tutorial: 'Voir le tutoriel',
        targetDuration: 'Durée visée',
        targetDurationHint: "Vous indique d'accélérer ou de ralentir. 0 = désactivé",
        readingLine: 'Ligne de lecture',
        readingLineHint: 'Garde la ligne en cours en haut, près de votre caméra',
        clickThrough: 'Clics traversants',
        clickThroughHint: (keys: string) => `Les clics vont à l'application derrière. Désactivez avec ${keys} ou l'icône de la barre`,
    },

    tour: {
        next: 'Suivant',
        prev: 'Retour',
        done: 'Terminé',
        welcomeTitle: 'Bienvenue',
        welcome: 'Une visite rapide du prompteur. Cela prend trente secondes.',
        scriptTitle: 'Votre texte',
        script: "Collez-le, importez un fichier .txt ou appuyez sur Modifier pour l'écrire ici.",
        startTitle: "Lancez l'écoute",
        start: 'Appuyez sur Démarrer (ou Espace) et lisez à voix haute. Le texte suit votre voix.',
        languageTitle: 'Langue parlée',
        language: 'Choisissez la langue dans laquelle vous allez parler.',
        micTitle: 'Microphone',
        mic: 'Choisissez le microphone que le prompteur écoute.',
        lookTitle: 'Personnalisez',
        look: 'Taille du texte, couleur et opacité du fond, et couleur du texte.',
        settingsTitle: 'Paramètres',
        settings: "Langue de l'interface, masquage lors du partage d'écran, contraste automatique et plus.",
        canvasTitle: 'Perdu le fil ?',
        canvas: "Cliquez sur n'importe quel mot pour reprendre à partir de là. Les flèches avancent mot par mot.",
        menuTitle: "Barre d'outils",
        menu: 'Ouvrez ou fermez cette barre ici. Maintenez le bouton pour déplacer la fenêtre.',
    },

    cards: {
        label: (n: number) => `Diapo ${n}`,
        position: (n: number, total: number) => `Diapo ${n} / ${total}`,
        previous: 'Diapo précédente',
        next: 'Diapo suivante',
        hint: 'Astuce : une ligne avec --- commence une nouvelle carte de diapo',
    },

    pace: {
        wpm: (n: number) => `${n} mots/min`,
        left: (time: string) => `reste ${time}`,
        estimate: (time: string) => `≈ ${time} de lecture`,
        target: (time: string) => `objectif ${time}`,
        'on-pace': 'Bon rythme',
        'speed-up': 'Accélérez',
        'slow-down': 'Ralentissez',
    },

    shortcuts: {
        title: 'Raccourcis globaux',
        toggleListening: 'Démarrer / pause',
        nextCard: 'Diapo suivante',
        previousCard: 'Diapo précédente',
        toggleWindow: 'Afficher / masquer la fenêtre',
        toggleClickThrough: 'Clics traversants oui / non',
    },

    statusBar: {
        clickThroughOn: 'Clics traversants',
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
        clickThrough: 'Activer/désactiver les clics traversants',
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
