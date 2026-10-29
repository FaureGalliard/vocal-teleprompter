import type { Messages } from './en'

export const ja: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Vocal Teleprompter へようこそ。開始を押して、この文章を声に出して読んでください。プロンプターがあなたの声を聞き取り、一語ずつ追いかけます。好きなときに間を取っても、速く読んでもゆっくり読んでも、ちゃんと待ってくれます。どの単語でもクリックするとそこから再開でき、編集を押せば自分の原稿を書けます。Zoom や Meet で画面を共有しても、このウィンドウは視聴者には見えません。',

    toolbar: {
        more: '原稿とヘルプ',
        editScript: '原稿を編集',
        finishEditing: '編集を終了',
        pasteScript: 'クリップボードから貼り付け',
        importScript: '.txt ファイルを読み込む',
        clearScript: '原稿を消去',
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
        targetDuration: '目標時間',
        targetDurationHint: '速めるか遅くするかを知らせます。0 でオフ',
        readingLine: '読み上げライン',
        readingLineHint: '現在の行をカメラに近い上部に保ちます',
        clickThrough: 'クリックを透過',
        clickThroughHint: (keys: string) => `クリックが背後のアプリに届きます。${keys} かトレイアイコンで解除`,
        countdown: 'カウントダウン',
        countdownHint: '聞き取り開始前に準備する秒数',
        countdownOff: 'オフ',
        sectionReading: '読み上げ',
        sectionWindow: 'ウィンドウ',
        sectionGeneral: '一般',
    },

    tour: {
        next: '次へ',
        prev: '戻る',
        done: '完了',
        welcomeTitle: 'ようこそ',
        welcome: 'プロンプターをざっと紹介します。30秒ほどで終わります。',
        scriptTitle: '原稿',
        script: 'このメニューから原稿の編集、貼り付け、読み込み、消去ができます。',
        startTitle: '聞き取りを開始',
        start: '開始（またはスペース）を押して声に出して読みましょう。テキストが声についてきます。',
        languageTitle: '音声の言語',
        language: '話す言語を選んでください。',
        micTitle: 'マイク',
        mic: '聞き取るマイクを選び、入力レベルを確認します。',
        lookTitle: 'お好みに',
        look: '文字サイズ、色、自動コントラスト、タイポグラフィ。',
        settingsTitle: '設定',
        settings: 'テキストのスクロール、カウントダウン、画面共有時に隠す、表示言語など。',
        canvasTitle: '編集またはジャンプ',
        canvas: '単語をクリックするとその場所で原稿を編集できます。Ctrl+クリック（または聞き取り中のクリック）でその単語から読み進めます。',
        menuTitle: 'ツールバー',
        menu: 'ここでツールバーを開閉します。ボタンを長押しするとウィンドウを移動できます。',
    },

    cards: {
        position: (n: number, total: number) => `スライド ${n} / ${total}`,
        previous: '前のスライド',
        next: '次のスライド',
        hint: 'ヒント：--- だけの行で新しいスライドカードになります',
    },

    pace: {
        wpm: (n: number) => `${n} 語/分`,
        left: (time: string) => `残り ${time}`,
        estimate: (time: string) => `読了まで約 ${time}`,
        target: (time: string) => `目標 ${time}`,
        'on-pace': '良いペース',
        'speed-up': '速めて',
        'slow-down': 'ゆっくり',
    },

    shortcuts: {
        title: 'グローバルショートカット',
        toggleListening: '開始 / 一時停止',
        nextCard: '次のスライド',
        previousCard: '前のスライド',
        toggleWindow: 'ウィンドウの表示 / 非表示',
        toggleClickThrough: 'クリック透過 オン / オフ',
        change: 'クリックして新しい組み合わせを押してください',
        pressKeys: 'キーを押してください…',
        taken: (action: string) => `「${action}」で使用中です`,
        unavailable: '別のアプリがこの組み合わせを使っています。別のものを選んでください',
        resetDefaults: '既定のショートカットに戻す',
    },

    statusBar: {
        clickThroughOn: 'クリック透過中',
    },

    updates: {
        available: (v: string) => `バージョン ${v} が利用可能です`,
        install: '今すぐ更新',
        installVersion: (v: string) => `${v} をインストール`,
        later: 'あとで',
        downloading: (p: number) => `アップデートをダウンロード中… ${p}%`,
        check: 'アップデートを確認',
        checking: '確認中…',
        upToDate: '最新の状態です',
        failed: 'アップデートを確認できませんでした',
        autoCheck: 'アップデートを自動で確認',
        version: (v: string) => `バージョン ${v}`,
    },

    typography: {
        title: 'タイポグラフィ',
        fonts: { sans: 'ゴシック', serif: '明朝', mono: '等幅', rounded: '丸ゴシック', legible: '読みやすい' },
        weights: { 400: '標準', 600: 'やや太字', 700: '太字' },
        lineHeight: '行間',
        width: 'テキストの幅',
        alignCenter: '中央揃え',
        alignLeft: '左揃え',
        reset: '既定に戻す',
    },

    ai: {
        title: 'AI コネクタ（MCP）',
        hint: 'Claude などの AI アシスタントに原稿を書かせ、ここに読み込めます',
        connect: '接続',
        connected: '接続済み',
        copy: 'ほかのアプリ用の設定をコピー',
        copied: 'コピーしました',
        restart: (app: string) => `完了しました。${app} を再起動してください`,
    },

    appearance: {
        title: '表示',
        opacity: '背景の不透明度',
    },

    mic: {
        title: '使用中のマイク',
        level: '入力レベル：話してテストしてください',
        hint: '音声認識は常に Windows の既定のマイクを使います。別のマイクを使うには Windows で既定を変更してください。',
        change: 'Windows で変更',
        heard: 'プロンプターが聞き取った内容',
        systemDefault: 'システムの既定',
    },

    speechModel: {
        failed: '音声モデルをダウンロードできませんでした。接続を確認して、もう一度開始を押してください',
        title: (language: string) => `音声モデルをダウンロード中：${language}`,
        hint: 'この言語を認識するために一度だけ必要です。準備ができるとすぐに聞き取りを始めます。',
        failedTitle: '音声モデルをダウンロードできませんでした',
        retry: '再試行',
        waiting: '音声モデルを待っています…',
    },

    scrolling: {
        title: 'スクロール',
        ahead: '下に行を残す',
        fixed: '行を固定',
        aheadHint: 'テキストは止まったままで、下に数行見えるように必要なときだけ進みます',
        fixedHint: '読んでいる行を同じ高さに保ちます',
        linesBelow: '下に残す行数',
        position: '行の位置',
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
        clickThrough: 'クリック透過の切り替え',
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
        'model-missing': 'この言語の音声モデルはまだインストールされていません',
        'model-unreadable': '音声モデルを読み込めませんでした。削除して再ダウンロードしてください',
        'microphone-unavailable': 'そのマイクは使用できません。別のマイクを選んでください',
    },
}
