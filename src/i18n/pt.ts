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
        speechLanguage: 'Idioma da fala',
        microphone: 'Microfone',
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
        tutorial: 'Ver tutorial',
        targetDuration: 'Duração desejada',
        targetDurationHint: 'Avisa se você deve acelerar ou desacelerar. 0 = desligado',
    },

    tour: {
        next: 'Próximo',
        prev: 'Voltar',
        done: 'Pronto',
        welcomeTitle: 'Bem-vindo',
        welcome: 'Um tour rápido pelo teleprompter. Leva meio minuto.',
        scriptTitle: 'Seu roteiro',
        script: 'Cole, importe um arquivo .txt ou pressione Editar para escrever aqui mesmo.',
        startTitle: 'Comece a ouvir',
        start: 'Pressione Iniciar (ou Espaço) e leia em voz alta. O texto acompanha sua voz.',
        languageTitle: 'Idioma da fala',
        language: 'Escolha o idioma em que você vai falar.',
        micTitle: 'Microfone',
        mic: 'Escolha qual microfone o teleprompter escuta.',
        lookTitle: 'Do seu jeito',
        look: 'Tamanho do texto, cor e opacidade do fundo e cor do texto.',
        settingsTitle: 'Configurações',
        settings: 'Idioma da interface, ocultar ao compartilhar a tela, contraste automático e mais.',
        canvasTitle: 'Se perdeu?',
        canvas: 'Clique em qualquer palavra para continuar dali. As setas avançam palavra por palavra.',
        menuTitle: 'Barra de ferramentas',
        menu: 'Abra ou feche esta barra aqui. Segure o botão para mover a janela.',
    },

    cards: {
        label: (n: number) => `Slide ${n}`,
        position: (n: number, total: number) => `Slide ${n} / ${total}`,
        previous: 'Slide anterior',
        next: 'Próximo slide',
        hint: 'Dica: uma linha com --- começa um novo cartão de slide',
    },

    pace: {
        wpm: (n: number) => `${n} ppm`,
        left: (time: string) => `faltam ${time}`,
        estimate: (time: string) => `≈ ${time} de leitura`,
        target: (time: string) => `meta ${time}`,
        'on-pace': 'No ritmo',
        'speed-up': 'Acelere',
        'slow-down': 'Mais devagar',
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
