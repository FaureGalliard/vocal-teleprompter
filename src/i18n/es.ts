import type { Messages } from './en'

export const es: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Bienvenido a Vocal Teleprompter. Pulsa Iniciar y lee este texto en voz alta: el teleprompter te escucha y sigue tu voz palabra por palabra. Haz pausas cuando quieras, acelera o ve más despacio, y te esperará. Haz click en cualquier palabra para continuar desde ahí. Cuando compartas pantalla en Zoom o Meet, esta ventana queda oculta para tu audiencia.',

    toolbar: {
        paste: '+ PEGAR',
        import: '↑ IMPORTAR',
        clear: '✕ ELIMINAR',
        start: '🎙 INICIAR',
        stop: '⏹ DETENER',
        pause: '⏸ PAUSAR',
        resume: '▶ REANUDAR',
        noMicrophones: 'Sin micrófonos',
        size: 'Tamaño',
        background: 'Fondo',
        text: 'Texto',
        bar: 'BARRA',
        autoContrast: '◐ AUTO',
        autoContrastOn: 'Contraste automático activado',
        autoContrastOff: 'Contraste automático desactivado',
        hidden: '🕶 OCULTO',
        visible: '👁 VISIBLE',
        hiddenTitle: 'Invisible al compartir pantalla o grabar',
        visibleTitle: 'Visible al compartir pantalla o grabar',
        uiLanguage: 'Idioma de la interfaz',
        ok: 'OK',
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
