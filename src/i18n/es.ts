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
