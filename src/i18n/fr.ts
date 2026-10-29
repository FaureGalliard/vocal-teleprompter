import type { Messages } from './en'

export const fr: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        "Bienvenue dans Vocal Teleprompter. Appuyez sur Démarrer et lisez ce texte à voix haute : le prompteur vous écoute et suit votre voix mot à mot. Faites une pause quand vous voulez, accélérez ou ralentissez, il vous attendra. Cliquez sur n'importe quel mot pour reprendre à partir de là, ou appuyez sur Modifier pour écrire votre propre texte. Quand vous partagez votre écran dans Zoom ou Meet, cette fenêtre reste invisible pour votre public.",

    toolbar: {
        more: 'Texte et aide',
        editScript: 'Modifier le texte',
        finishEditing: 'Terminer la modification',
        pasteScript: 'Coller depuis le presse-papiers',
        importScript: 'Importer un fichier .txt',
        clearScript: 'Effacer le texte',
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
        clickThroughHint: (keys: string) =>
            `Les clics vont à l'application derrière. Désactivez avec ${keys} ou l'icône de la barre`,
        countdown: 'Compte à rebours',
        countdownHint: "Secondes pour vous préparer avant le début de l'écoute",
        countdownOff: 'Non',
        sectionReading: 'Lecture',
        sectionWindow: 'Fenêtre',
        sectionGeneral: 'Général',
    },

    tour: {
        next: 'Suivant',
        prev: 'Retour',
        done: 'Terminé',
        welcomeTitle: 'Bienvenue',
        welcome: 'Une visite rapide du prompteur. Cela prend trente secondes.',
        scriptTitle: 'Votre texte',
        script: 'Modifiez, collez, importez ou effacez votre texte depuis ce menu.',
        startTitle: "Lancez l'écoute",
        start: 'Appuyez sur Démarrer (ou Espace) et lisez à voix haute. Le texte suit votre voix.',
        languageTitle: 'Langue parlée',
        language: 'Choisissez la langue dans laquelle vous allez parler.',
        micTitle: 'Microphone',
        mic: 'Choisissez le microphone à écouter et vérifiez son niveau.',
        lookTitle: 'Personnalisez',
        look: 'Taille du texte, couleurs, contraste automatique et typographie.',
        settingsTitle: 'Paramètres',
        settings:
            "Défilement du texte, compte à rebours, masquage lors du partage d'écran, langue de l'interface et plus.",
        canvasTitle: 'Modifier ou sauter',
        canvas: 'Cliquez sur un mot pour reprendre la lecture à partir de lui. Cliquez-le à nouveau, ou cliquez entre deux mots, pour modifier le texte à cet endroit.',
        menuTitle: "Barre d'outils",
        menu: 'Ouvrez ou fermez la barre ici. Maintenez le bouton pour déplacer la fenêtre.',
    },

    cards: {
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
        change: 'Cliquez puis appuyez sur la nouvelle combinaison',
        pressKeys: 'Appuyez…',
        taken: (action: string) => `Déjà utilisé par « ${action} »`,
        unavailable: 'Une autre application utilise cette combinaison ; choisissez-en une autre',
        resetDefaults: 'Rétablir les raccourcis par défaut',
    },

    statusBar: {
        clickThroughOn: 'Clics traversants',
    },

    updates: {
        available: (v: string) => `La version ${v} est disponible`,
        install: 'Mettre à jour',
        installVersion: (v: string) => `Installer ${v}`,
        later: 'Plus tard',
        downloading: (p: number) => `Téléchargement de la mise à jour… ${p}%`,
        check: 'Rechercher des mises à jour',
        checking: 'Recherche…',
        upToDate: 'Vous êtes à jour',
        failed: 'Impossible de rechercher des mises à jour',
        autoCheck: 'Rechercher les mises à jour automatiquement',
        version: (v: string) => `Version ${v}`,
    },

    typography: {
        title: 'Typographie',
        fonts: {
            sans: 'Sans',
            serif: 'Serif',
            mono: 'Mono',
            rounded: 'Arrondie',
            legible: 'Lisible',
        },
        weights: { 400: 'Normal', 600: 'Demi-gras', 700: 'Gras' },
        lineHeight: 'Interligne',
        width: 'Largeur du texte',
        alignCenter: 'Centré',
        alignLeft: 'Aligné à gauche',
        reset: 'Valeurs par défaut',
    },

    ai: {
        title: 'Connecteur IA (MCP)',
        hint: "Laissez Claude et d'autres assistants IA écrire votre texte et le charger ici",
        connect: 'Connecter',
        connected: 'Connecté',
        copy: 'Copier la configuration pour une autre app',
        copied: 'Copié',
        restart: (app: string) => `C'est fait. Redémarrez ${app} pour l'utiliser`,
    },

    appearance: {
        title: 'Apparence',
        opacity: 'Opacité du fond',
        soften: "Adoucir l'arrière-plan",
        softenHint:
            'Floute ce qui se voit à travers le fond, comme du verre dépoli, pour que le texte ressorte',
    },

    mic: {
        title: 'Microphone utilisé',
        level: "Niveau d'entrée : parlez pour le tester",
        hint: 'La reconnaissance vocale écoute toujours le microphone par défaut de Windows. Pour en utiliser un autre, changez-le dans Windows.',
        change: 'Changer dans Windows',
        heard: 'Ce que le prompteur entend',
        systemDefault: 'Par défaut du système',
    },

    speechModel: {
        failed: 'Impossible de télécharger le modèle vocal. Vérifiez la connexion et appuyez de nouveau sur Démarrer',
        title: (language: string) => `Téléchargement du modèle vocal : ${language}`,
        hint: "Nécessaire une seule fois pour comprendre cette langue. Le prompteur écoute dès qu'il est prêt.",
        failedTitle: "Le modèle vocal n'a pas pu être téléchargé",
        retry: 'Réessayer',
        waiting: 'En attente du modèle vocal…',
    },

    scrolling: {
        title: 'Défilement',
        ahead: 'Lignes en dessous',
        fixed: 'Ligne fixe',
        aheadHint:
            'Le texte reste en place et ne bouge que pour garder quelques lignes visibles dessous',
        fixedHint: 'La ligne lue reste à la même hauteur',
        linesBelow: 'Lignes gardées dessous',
        position: 'Position de la ligne',
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
        'model-missing': "Le modèle vocal de cette langue n'est pas encore installé",
        'model-unreadable':
            'Impossible de charger le modèle vocal ; supprimez-le et téléchargez-le de nouveau',
        'microphone-unavailable': "Ce microphone n'est pas disponible ; choisissez-en un autre",
    },
}
