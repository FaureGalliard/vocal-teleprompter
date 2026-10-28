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
        readingLine: 'Linha de leitura',
        readingLineHint: 'Mantém a linha atual no alto, perto da sua câmera',
        clickThrough: 'Cliques atravessam',
        clickThroughHint: (keys: string) => `Os cliques vão para o app de trás. Desative com ${keys} ou pelo ícone da bandeja`,
        countdown: 'Contagem regressiva',
        countdownHint: 'Segundos para se preparar antes de começar a ouvir',
        countdownOff: 'Não',
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
        mic: 'Escolha qual microfone ele escuta e confira o nível.',
        lookTitle: 'Do seu jeito',
        look: 'Tamanho do texto, cor e opacidade do fundo e cor do texto.',
        settingsTitle: 'Configurações',
        settings: 'Idioma da interface, ocultar ao compartilhar a tela, contraste automático e mais.',
        canvasTitle: 'Editar ou pular',
        canvas: 'Clique em uma palavra para editar o roteiro ali mesmo. Com Ctrl+clique (ou um clique enquanto ouve) você continua lendo a partir dessa palavra.',
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

    shortcuts: {
        title: 'Atalhos globais',
        toggleListening: 'Iniciar / pausar',
        nextCard: 'Próximo slide',
        previousCard: 'Slide anterior',
        toggleWindow: 'Mostrar / ocultar janela',
        toggleClickThrough: 'Cliques atravessam sim / não',
        change: 'Clique e pressione a nova combinação',
        pressKeys: 'Pressione as teclas…',
        taken: (action: string) => `Já usada por “${action}”`,
        unavailable: 'Outro app usa esta combinação; escolha outra',
        resetDefaults: 'Restaurar atalhos padrão',
    },

    statusBar: {
        clickThroughOn: 'Cliques atravessam',
    },

    updates: {
        available: (v: string) => `A versão ${v} está disponível`,
        install: 'Atualizar agora',
        installVersion: (v: string) => `Instalar ${v}`,
        later: 'Depois',
        downloading: (p: number) => `Baixando atualização… ${p}%`,
        check: 'Procurar atualizações',
        checking: 'Procurando…',
        upToDate: 'Você está na versão mais recente',
        failed: 'Não foi possível procurar atualizações',
        autoCheck: 'Procurar atualizações automaticamente',
        version: (v: string) => `Versão ${v}`,
    },

    typography: {
        title: 'Tipografia',
        fonts: { sans: 'Sans', serif: 'Serif', mono: 'Mono', rounded: 'Arredondada', legible: 'Legível' },
        weights: { 400: 'Normal', 600: 'Seminegrito', 700: 'Negrito' },
        lineHeight: 'Entrelinha',
        width: 'Largura do texto',
        alignCenter: 'Centralizado',
        alignLeft: 'Alinhado à esquerda',
        reset: 'Restaurar padrão',
    },

    ai: {
        title: 'Conector de IA (MCP)',
        hint: 'Deixe o Claude e outras IAs escreverem seu roteiro e carregarem aqui',
        connect: 'Conectar',
        connected: 'Conectado',
        copy: 'Copiar a configuração para outro app',
        copied: 'Copiado',
        restart: (app: string) => `Pronto. Reinicie o ${app} para usar`,
    },

    appearance: {
        title: 'Aparência',
        opacity: 'Opacidade do fundo',
    },

    mic: {
        title: 'Microfone em uso',
        level: 'Nível de entrada: fale para testar',
        hint: 'O reconhecimento de voz sempre ouve o microfone padrão do Windows. Para usar outro, troque-o no Windows.',
        change: 'Trocar no Windows',
        heard: 'O que o teleprompter ouve',
        systemDefault: 'Padrão do sistema',
    },

    speechModel: {
        failed: 'Não foi possível baixar o modelo de voz. Verifique a conexão e pressione Iniciar de novo',
        title: (language: string) => `Baixando o modelo de voz: ${language}`,
        hint: 'Necessário uma única vez para entender este idioma. O teleprompter começa a ouvir assim que estiver pronto.',
        failedTitle: 'O modelo de voz não foi baixado',
        retry: 'Tentar de novo',
        waiting: 'Aguardando o modelo de voz…',
    },

    scrolling: {
        title: 'Rolagem',
        ahead: 'Linhas abaixo',
        fixed: 'Linha fixa',
        aheadHint: 'O texto fica parado e só avança para manter algumas linhas visíveis abaixo',
        fixedHint: 'A linha que você lê fica na mesma altura',
        linesBelow: 'Linhas mantidas abaixo',
        position: 'Posição da linha',
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
        clickThrough: 'Ativar/desativar cliques atravessam',
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
        'model-missing': 'O modelo de voz deste idioma ainda não está instalado',
        'model-unreadable': 'Não foi possível carregar o modelo de voz; apague-o e baixe de novo',
        'microphone-unavailable': 'Esse microfone não está disponível; escolha outro',
    },
}
