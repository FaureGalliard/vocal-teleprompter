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
        tutorial: 'チュートリアルを見る',
    },

    tour: {
        next: '次へ',
        prev: '戻る',
        done: '完了',
        welcomeTitle: 'ようこそ',
        welcome: 'プロンプターをざっと紹介します。30秒ほどで終わります。',
        scriptTitle: '原稿',
        script: '貼り付けるか、.txt ファイルを読み込むか、編集を押してここに直接書いてください。',
        startTitle: '聞き取りを開始',
        start: '開始（またはスペース）を押して声に出して読みましょう。テキストが声についてきます。',
        languageTitle: '音声の言語',
        language: '話す言語を選んでください。',
        micTitle: 'マイク',
        mic: 'プロンプターが聞き取るマイクを選びます。',
        lookTitle: 'お好みに',
        look: '文字サイズ、背景の色と不透明度、文字の色。',
        settingsTitle: '設定',
        settings: '表示言語、画面共有時に隠す、自動コントラストなど。',
        canvasTitle: 'どこまで読んだか分からない？',
        canvas: 'どの単語でもクリックするとそこから再開します。矢印キーで一語ずつ移動できます。',
        menuTitle: 'ツールバー',
        menu: 'ここでこのバーを開閉します。ボタンを長押しするとウィンドウを移動できます。',
    },

    cards: {
        label: (n: number) => `スライド ${n}`,
        position: (n: number, total: number) => `スライド ${n} / ${total}`,
        previous: '前のスライド',
        next: '次のスライド',
        hint: 'ヒント：--- だけの行で新しいスライドカードになります',
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
