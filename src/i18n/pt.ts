import type { Messages } from './en'

export const pt: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Bem-vindo ao Vocal Teleprompter. Pressione Iniciar e leia este texto em voz alta: o teleprompter escuta você e acompanha sua voz palavra por palavra. Faça pausas quando quiser, acelere ou vá mais devagar, e ele vai esperar por você. Clique em qualquer palavra para continuar a partir dali, ou pressione Editar para escrever seu próprio roteiro. Quando você compartilhar a tela no Zoom ou no Meet, esta janela fica oculta para o seu público.',

    toolbar: {
        paste: 'COLAR',
        import: 'IMPORTAR',
        clear: 'LIMPAR',
        edit: 'EDITAR',
        done: 'PRONTO',
        start: 'INICIAR',
        stop: 'PARAR',
        pause: 'PAUSAR',
        resume: 'RETOMAR',
        noMicrophones: 'Nenhum microfone',
        size: 'Tamanho',
        background: 'Fundo',
        text: 'Texto',
        ok: 'OK',
    },

    settings: {
        title: 'Configurações',
        interfaceLanguage: 'Idioma da interface',
        hideFromCapture: 'Ocultar ao compartilhar a tela',
        hideFromCaptureHint: 'Zoom, Meet, OBS e capturas de tela não verão esta janela',
        autoContrast: 'Contraste automático',
        autoContrastHint: 'Ajusta a cor do texto para que sempre fique legível',
        titleBar: 'Mostrar barra de título',
        reset: 'Redefinir todas as configurações',
        resetConfirm: 'Clique de novo para redefinir',
    },

    titleBar: {
        moveDown: 'Mover para baixo',
        moveUp: 'Mover para cima',
        minimize: 'Minimizar',
        maximize: 'Maximizar',
        close: 'Fechar',
    },

    tray: {
        show: 'Mostrar',
        hide: 'Ocultar',
        quit: 'Sair',
    },

    canvas: {
        placeholder: 'Seu texto aparecerá aqui',
        editPlaceholder: 'Escreva ou cole seu roteiro aqui…',
    },

    textFiles: 'Texto',
    microphone: (id: string) => `Microfone ${id}`,

    errors: {
        unsupported: 'Reconhecimento de voz indisponível',
        microphone: 'Não foi possível acessar o microfone',
        'not-allowed': 'Permissão do microfone negada',
        'service-not-allowed': 'Serviço de voz não permitido',
        'audio-capture': 'Nenhum microfone encontrado',
        'language-not-supported': 'Idioma não suportado',
        network: 'Erro de rede, tentando novamente…',
    },
}
