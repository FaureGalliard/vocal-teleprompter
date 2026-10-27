import type { Messages } from './en'

export const ja: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Vocal Teleprompter へようこそ。開始を押して、この文章を声に出して読んでください。プロンプターがあなたの声を聞き取り、一語ずつ追いかけます。好きなときに間を取っても、速く読んでもゆっくり読んでも、ちゃんと待ってくれます。どの単語でもクリックするとそこから再開でき、編集を押せば自分の原稿を書けます。Zoom や Meet で画面を共有しても、このウィンドウは視聴者には見えません。',

    toolbar: {
        paste: '貼り付け',
        import: '読み込み',
        clear: '消去',
        edit: '編集',
        done: '完了',
        start: '開始',
        stop: '停止',
        pause: '一時停止',
        resume: '再開',
        noMicrophones: 'マイクがありません',
        speechLanguage: '音声の言語',
        microphone: 'マイク',
        size: 'サイズ',
        background: '背景',
        text: '文字',
        ok: 'OK',
    },

    settings: {
        title: '設定',
        interfaceLanguage: '表示言語',
        hideFromCapture: '画面共有時に隠す',
        hideFromCaptureHint: 'Zoom、Meet、OBS、スクリーンショットにこのウィンドウは映りません',
        autoContrast: '自動コントラスト',
        autoContrastHint: '文字がいつも読みやすいように色を調整します',
        titleBar: 'タイトルバーを表示',
        reset: 'すべての設定をリセット',
        resetConfirm: 'もう一度クリックでリセット',
    },

    titleBar: {
        moveDown: '下に移動',
        moveUp: '上に移動',
        minimize: '最小化',
        maximize: '最大化',
        close: '閉じる',
    },

    tray: {
        show: '表示',
        hide: '隠す',
        quit: '終了',
    },

    canvas: {
        placeholder: 'ここにテキストが表示されます',
        editPlaceholder: 'ここに原稿を入力または貼り付けてください…',
    },

    textFiles: 'テキスト',
    microphone: (id: string) => `マイク ${id}`,

    errors: {
        unsupported: '音声認識を利用できません',
        microphone: 'マイクにアクセスできません',
        'not-allowed': 'マイクの使用が拒否されました',
        'service-not-allowed': '音声サービスが許可されていません',
        'audio-capture': 'マイクが見つかりません',
        'language-not-supported': 'この言語には対応していません',
        network: 'ネットワークエラー、再試行しています…',
    },
}
