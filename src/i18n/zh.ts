import type { Messages } from './en'

export const zh: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        '欢迎使用 Vocal Teleprompter。点击开始，然后大声朗读这段文字：提词器会聆听你的声音，逐字跟随。你可以随时停顿，读快或读慢，它都会等你。点击任意一个词即可从那里继续，或者点击编辑来写你自己的稿子。在 Zoom 或 Meet 中共享屏幕时，观众看不到这个窗口。',

    toolbar: {
        paste: '粘贴',
        import: '导入',
        clear: '清空',
        edit: '编辑',
        done: '完成',
        start: '开始',
        stop: '停止',
        pause: '暂停',
        resume: '继续',
        noMicrophones: '没有麦克风',
        speechLanguage: '语音语言',
        microphone: '麦克风',
        size: '字号',
        background: '背景',
        text: '文字',
        ok: '确定',
    },

    settings: {
        title: '设置',
        interfaceLanguage: '界面语言',
        hideFromCapture: '共享屏幕时隐藏',
        hideFromCaptureHint: 'Zoom、Meet、OBS 和截图都看不到这个窗口',
        autoContrast: '自动对比度',
        autoContrastHint: '调整文字颜色，确保始终清晰可读',
        titleBar: '显示标题栏',
        reset: '重置所有设置',
        resetConfirm: '再次点击以重置',
        tutorial: '查看教程',
        targetDuration: '目标时长',
        targetDurationHint: '提示你加快或放慢语速。0 = 关闭',
        readingLine: '阅读线',
        readingLineHint: '让当前行保持在上方，靠近摄像头',
        clickThrough: '点击穿透',
        clickThroughHint: (keys: string) => `点击会传到后面的应用。按 ${keys} 或通过托盘图标关闭`,
        countdown: '倒计时',
        countdownHint: '开始聆听前的准备秒数',
        countdownOff: '关',
    },

    tour: {
        next: '下一步',
        prev: '上一步',
        done: '完成',
        welcomeTitle: '欢迎',
        welcome: '快速了解一下提词器，只需半分钟。',
        scriptTitle: '你的稿子',
        script: '粘贴、导入 .txt 文件，或点击编辑直接在这里写。',
        startTitle: '开始聆听',
        start: '点击开始（或按空格）然后大声朗读，文字会跟随你的声音。',
        languageTitle: '语音语言',
        language: '选择你要说的语言。',
        micTitle: '麦克风',
        mic: '选择提词器使用的麦克风。',
        lookTitle: '按你的喜好',
        look: '字号、背景颜色和不透明度，以及文字颜色。',
        settingsTitle: '设置',
        settings: '界面语言、共享屏幕时隐藏、自动对比度等。',
        canvasTitle: '编辑或跳转',
        canvas: '点击一个词即可在那里编辑稿子。Ctrl+点击（或在聆听时点击）则从这个词继续朗读。',
        menuTitle: '工具栏',
        menu: '在这里打开或关闭工具栏。按住按钮可以拖动窗口。',
    },

    cards: {
        label: (n: number) => `幻灯片 ${n}`,
        position: (n: number, total: number) => `幻灯片 ${n} / ${total}`,
        previous: '上一张幻灯片',
        next: '下一张幻灯片',
        hint: '提示：单独一行 --- 会开始一张新的幻灯片卡片',
    },

    pace: {
        wpm: (n: number) => `${n} 词/分`,
        left: (time: string) => `剩余 ${time}`,
        estimate: (time: string) => `约 ${time} 读完`,
        target: (time: string) => `目标 ${time}`,
        'on-pace': '节奏正好',
        'speed-up': '加快',
        'slow-down': '放慢',
    },

    shortcuts: {
        title: '全局快捷键',
        toggleListening: '开始 / 暂停',
        nextCard: '下一张幻灯片',
        previousCard: '上一张幻灯片',
        toggleWindow: '显示 / 隐藏窗口',
        toggleClickThrough: '点击穿透 开 / 关',
        change: '点击后按下新的组合键',
        pressKeys: '请按键…',
        taken: (action: string) => `已被“${action}”使用`,
        unavailable: '其他应用正在使用这个组合键，请换一个',
        resetDefaults: '恢复默认快捷键',
    },

    statusBar: {
        clickThroughOn: '点击穿透中',
    },

    updates: {
        available: (v: string) => `${v} 版本可用`,
        install: '立即更新',
        installVersion: (v: string) => `安装 ${v}`,
        later: '稍后',
        downloading: (p: number) => `正在下载更新… ${p}%`,
        check: '检查更新',
        checking: '正在检查…',
        upToDate: '已是最新版本',
        failed: '无法检查更新',
        autoCheck: '自动检查更新',
        version: (v: string) => `版本 ${v}`,
    },

    typography: {
        title: '字体排版',
        fonts: { sans: '无衬线', serif: '衬线', mono: '等宽', rounded: '圆体', legible: '易读' },
        weights: { 400: '常规', 600: '中粗', 700: '粗体' },
        lineHeight: '行距',
        width: '文字宽度',
        alignCenter: '居中',
        alignLeft: '左对齐',
        reset: '恢复默认',
    },

    ai: {
        title: 'AI 连接器（MCP）',
        hint: '让 Claude 等 AI 助手撰写稿子并直接加载到这里',
        connect: '连接',
        connected: '已连接',
        copy: '复制给其他应用的配置',
        copied: '已复制',
        restart: (app: string) => `完成。重启 ${app} 后即可使用`,
    },

    appearance: {
        title: '外观',
        opacity: '背景不透明度',
    },

    mic: {
        title: '正在使用的麦克风',
        level: '输入音量：说话来测试',
        hint: '语音识别始终使用 Windows 的默认麦克风。要换用其他麦克风，请在 Windows 中更改默认设备。',
        change: '在 Windows 中更改',
        heard: '提词器听到的内容',
    },

    titleBar: {
        moveDown: '移到底部',
        moveUp: '移到顶部',
        minimize: '最小化',
        maximize: '最大化',
        close: '关闭',
    },

    tray: {
        show: '显示',
        hide: '隐藏',
        quit: '退出',
        clickThrough: '切换点击穿透',
    },

    canvas: {
        placeholder: '你的文字将显示在这里',
        editPlaceholder: '在这里输入或粘贴你的稿子…',
    },

    textFiles: '文本',
    microphone: (id: string) => `麦克风 ${id}`,

    errors: {
        unsupported: '语音识别不可用',
        microphone: '无法访问麦克风',
        'not-allowed': '麦克风权限被拒绝',
        'service-not-allowed': '语音服务不被允许',
        'audio-capture': '未找到麦克风',
        'language-not-supported': '不支持该语言',
        network: '网络错误，正在重试…',
    },
}
