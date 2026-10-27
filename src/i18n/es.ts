import type { Messages } from './en'

export const es: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Bienvenido a Vocal Teleprompter. Pulsa Iniciar y lee este texto en voz alta: el teleprompter te escucha y sigue tu voz palabra por palabra. Haz pausas cuando quieras, acelera o ve más despacio, y te esperará. Haz click en cualquier palabra para continuar desde ahí, o pulsa Editar para escribir tu propio guion. Cuando compartas pantalla en Zoom o Meet, esta ventana queda oculta para tu audiencia.',

    toolbar: {
        paste: 'PEGAR',
        import: 'IMPORTAR',
        clear: 'ELIMINAR',
        edit: 'EDITAR',
        done: 'LISTO',
        start: 'INICIAR',
        stop: 'DETENER',
        pause: 'PAUSAR',
        resume: 'REANUDAR',
        noMicrophones: 'Sin micrófonos',
        speechLanguage: 'Idioma de voz',
        microphone: 'Micrófono',
        size: 'Tamaño',
        background: 'Fondo',
        text: 'Texto',
        ok: 'OK',
    },

    settings: {
        title: 'Ajustes',
        interfaceLanguage: 'Idioma de la interfaz',
        hideFromCapture: 'Ocultar al compartir pantalla',
        hideFromCaptureHint: 'Zoom, Meet, OBS y las capturas no verán esta ventana',
        autoContrast: 'Contraste automático',
        autoContrastHint: 'Ajusta el color del texto para que siempre se lea',
        titleBar: 'Mostrar barra de título',
        reset: 'Restablecer todos los ajustes',
        resetConfirm: 'Haz click otra vez para restablecer',
        tutorial: 'Ver tutorial',
        targetDuration: 'Duración objetivo',
        targetDurationHint: 'Te avisa si debes ir más rápido o más lento. 0 = apagado',
        readingLine: 'Línea de lectura',
        readingLineHint: 'Mantiene la línea actual arriba, cerca de tu cámara',
    },

    tour: {
        next: 'Siguiente',
        prev: 'Atrás',
        done: 'Listo',
        welcomeTitle: 'Bienvenido',
        welcome: 'Un recorrido rápido por el teleprompter. Toma medio minuto.',
        scriptTitle: 'Tu guion',
        script: 'Pégalo, importa un archivo .txt o pulsa Editar para escribirlo aquí mismo.',
        startTitle: 'Empieza a escuchar',
        start: 'Pulsa Iniciar (o Espacio) y lee en voz alta. El texto sigue tu voz.',
        languageTitle: 'Idioma de voz',
        language: 'Elige el idioma en el que vas a hablar.',
        micTitle: 'Micrófono',
        mic: 'Elige qué micrófono escucha el teleprompter.',
        lookTitle: 'Hazlo tuyo',
        look: 'Tamaño del texto, color y opacidad del fondo, y color del texto.',
        settingsTitle: 'Ajustes',
        settings: 'Idioma de la interfaz, ocultar al compartir pantalla, contraste automático y más.',
        canvasTitle: '¿Te perdiste?',
        canvas: 'Haz click en cualquier palabra para seguir desde ahí. Las flechas avanzan palabra por palabra.',
        menuTitle: 'Barra de herramientas',
        menu: 'Abre o cierra esta barra aquí. Mantén pulsado el botón para mover la ventana.',
    },

    cards: {
        label: (n: number) => `Diapositiva ${n}`,
        position: (n: number, total: number) => `Diapositiva ${n} / ${total}`,
        previous: 'Diapositiva anterior',
        next: 'Diapositiva siguiente',
        hint: 'Consejo: una línea con --- empieza una nueva tarjeta de diapositiva',
    },

    pace: {
        wpm: (n: number) => `${n} ppm`,
        left: (time: string) => `quedan ${time}`,
        estimate: (time: string) => `≈ ${time} de lectura`,
        target: (time: string) => `objetivo ${time}`,
        'on-pace': 'Buen ritmo',
        'speed-up': 'Acelera',
        'slow-down': 'Más despacio',
    },

    shortcuts: {
        title: 'Atajos globales',
        toggleListening: 'Iniciar / pausar',
        nextCard: 'Diapositiva siguiente',
        previousCard: 'Diapositiva anterior',
        toggleWindow: 'Mostrar / ocultar ventana',
    },

    titleBar: {
        moveDown: 'Mover abajo',
        moveUp: 'Mover arriba',
        minimize: 'Minimizar',
        maximize: 'Maximizar',
        close: 'Cerrar',
    },

    tray: {
        show: 'Mostrar',
        hide: 'Ocultar',
        quit: 'Salir',
    },

    canvas: {
        placeholder: 'Tu texto aparecerá aquí',
        editPlaceholder: 'Escribe o pega tu guion aquí…',
    },

    textFiles: 'Texto',
    microphone: (id: string) => `Micrófono ${id}`,

    errors: {
        unsupported: 'Reconocimiento de voz no disponible',
        microphone: 'No se pudo acceder al micrófono',
        'not-allowed': 'Permiso de micrófono denegado',
        'service-not-allowed': 'Servicio de voz no permitido',
        'audio-capture': 'No se encontró ningún micrófono',
        'language-not-supported': 'Idioma no soportado',
        network: 'Error de red, reintentando…',
    },
}
