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
        clickThrough: 'Clicks a través',
        clickThroughHint: (keys: string) => `Los clicks llegan a la app de atrás. Se apaga con ${keys} o desde el icono de la bandeja`,
        countdown: 'Cuenta regresiva',
        countdownHint: 'Segundos para prepararte antes de empezar a escuchar',
        countdownOff: 'No',
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
        mic: 'Mira qué micrófono escucha y comprueba que te oye.',
        lookTitle: 'Hazlo tuyo',
        look: 'Tamaño del texto, color y opacidad del fondo, y color del texto.',
        settingsTitle: 'Ajustes',
        settings: 'Idioma de la interfaz, ocultar al compartir pantalla, contraste automático y más.',
        canvasTitle: 'Editar o saltar',
        canvas: 'Haz click en una palabra para editar el guion justo ahí. Con Ctrl+click (o un click mientras escuchas) sigues leyendo desde esa palabra.',
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
        toggleClickThrough: 'Clicks a través sí / no',
        change: 'Haz click y presiona la nueva combinación',
        pressKeys: 'Presiona teclas…',
        taken: (action: string) => `Ya la usa “${action}”`,
        unavailable: 'Otra app usa esta combinación; elige otra',
        resetDefaults: 'Restaurar atajos por defecto',
    },

    statusBar: {
        clickThroughOn: 'Clicks a través',
    },

    updates: {
        available: (v: string) => `La versión ${v} está disponible`,
        install: 'Actualizar ahora',
        installVersion: (v: string) => `Instalar ${v}`,
        later: 'Más tarde',
        downloading: (p: number) => `Descargando actualización… ${p}%`,
        check: 'Buscar actualizaciones',
        checking: 'Buscando…',
        upToDate: 'Tienes la última versión',
        failed: 'No se pudo buscar actualizaciones',
        autoCheck: 'Buscar actualizaciones automáticamente',
        version: (v: string) => `Versión ${v}`,
    },

    typography: {
        title: 'Tipografía',
        fonts: { sans: 'Sans', serif: 'Serif', mono: 'Mono', rounded: 'Redondeada', legible: 'Legible' },
        weights: { 400: 'Normal', 600: 'Seminegrita', 700: 'Negrita' },
        lineHeight: 'Interlineado',
        width: 'Ancho del texto',
        alignCenter: 'Centrado',
        alignLeft: 'Alineado a la izquierda',
        reset: 'Restaurar valores',
    },

    ai: {
        title: 'Conector de IA (MCP)',
        hint: 'Deja que Claude y otras IA escriban tu guion y lo carguen aquí',
        connect: 'Conectar',
        connected: 'Conectado',
        copy: 'Copiar la configuración para otra app',
        copied: 'Copiado',
        restart: (app: string) => `Listo. Reinicia ${app} para usarlo`,
    },

    appearance: {
        title: 'Apariencia',
        opacity: 'Opacidad del fondo',
    },

    mic: {
        title: 'Micrófono en uso',
        level: 'Nivel de entrada: habla para probarlo',
        hint: 'El reconocimiento de voz siempre escucha el micrófono predeterminado de Windows. Para usar otro, cámbialo en Windows.',
        change: 'Cambiar en Windows',
        heard: 'Lo que escucha el teleprompter',
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
        clickThrough: 'Activar/desactivar clicks a través',
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
