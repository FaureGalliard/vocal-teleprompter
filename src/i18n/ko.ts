import type { Messages } from './en'

export const ko: Messages = {
    appName: 'Vocal Teleprompter',
    sampleScript:
        'Vocal Teleprompter에 오신 것을 환영합니다. 시작을 누르고 이 글을 소리 내어 읽어 보세요. 프롬프터가 여러분의 목소리를 듣고 한 단어씩 따라갑니다. 원할 때 쉬어도 되고, 빠르게 또는 천천히 읽어도 기다려 줍니다. 아무 단어나 클릭하면 그 부분부터 이어서 읽을 수 있고, 편집을 누르면 직접 원고를 쓸 수 있습니다. Zoom이나 Meet에서 화면을 공유해도 이 창은 청중에게 보이지 않습니다.',

    toolbar: {
        paste: '붙여넣기',
        import: '가져오기',
        clear: '지우기',
        edit: '편집',
        done: '완료',
        start: '시작',
        stop: '중지',
        pause: '일시정지',
        resume: '계속',
        noMicrophones: '마이크 없음',
        speechLanguage: '음성 언어',
        microphone: '마이크',
        size: '크기',
        background: '배경',
        text: '텍스트',
        ok: '확인',
    },

    settings: {
        title: '설정',
        interfaceLanguage: '인터페이스 언어',
        hideFromCapture: '화면 공유 시 숨기기',
        hideFromCaptureHint: 'Zoom, Meet, OBS와 스크린샷에 이 창이 보이지 않습니다',
        autoContrast: '자동 대비',
        autoContrastHint: '텍스트가 항상 잘 보이도록 색상을 조정합니다',
        titleBar: '제목 표시줄 표시',
        reset: '모든 설정 초기화',
        resetConfirm: '한 번 더 클릭하면 초기화됩니다',
        tutorial: '튜토리얼 보기',
        targetDuration: '목표 시간',
        targetDurationHint: '빠르게 또는 천천히 말하라고 알려 줍니다. 0 = 끄기',
        readingLine: '읽기 라인',
        readingLineHint: '현재 줄을 카메라 가까운 위쪽에 유지합니다',
        clickThrough: '클릭 통과',
        clickThroughHint: (keys: string) => `클릭이 뒤에 있는 앱으로 전달됩니다. ${keys} 또는 트레이 아이콘으로 끄기`,
    },

    tour: {
        next: '다음',
        prev: '이전',
        done: '완료',
        welcomeTitle: '환영합니다',
        welcome: '프롬프터를 빠르게 둘러봅니다. 30초면 충분합니다.',
        scriptTitle: '원고',
        script: '붙여넣거나 .txt 파일을 가져오거나, 편집을 눌러 여기에서 바로 쓰세요.',
        startTitle: '듣기 시작',
        start: '시작(또는 스페이스)을 누르고 소리 내어 읽으세요. 텍스트가 목소리를 따라갑니다.',
        languageTitle: '음성 언어',
        language: '말할 언어를 선택하세요.',
        micTitle: '마이크',
        mic: '프롬프터가 들을 마이크를 선택하세요.',
        lookTitle: '나만의 스타일',
        look: '글자 크기, 배경 색상과 불투명도, 글자 색상.',
        settingsTitle: '설정',
        settings: '인터페이스 언어, 화면 공유 시 숨기기, 자동 대비 등.',
        canvasTitle: '편집 또는 이동',
        canvas: '단어를 클릭하면 그 위치에서 원고를 편집합니다. Ctrl+클릭(또는 듣는 중 클릭)하면 그 단어부터 이어서 읽습니다.',
        menuTitle: '도구 모음',
        menu: '여기에서 도구 모음을 열고 닫습니다. 버튼을 길게 누르면 창을 옮길 수 있습니다.',
    },

    cards: {
        label: (n: number) => `슬라이드 ${n}`,
        position: (n: number, total: number) => `슬라이드 ${n} / ${total}`,
        previous: '이전 슬라이드',
        next: '다음 슬라이드',
        hint: '팁: --- 만 있는 줄에서 새 슬라이드 카드가 시작됩니다',
    },

    pace: {
        wpm: (n: number) => `분당 ${n}단어`,
        left: (time: string) => `${time} 남음`,
        estimate: (time: string) => `약 ${time} 소요`,
        target: (time: string) => `목표 ${time}`,
        'on-pace': '적당한 속도',
        'speed-up': '더 빠르게',
        'slow-down': '더 천천히',
    },

    shortcuts: {
        title: '전역 단축키',
        toggleListening: '시작 / 일시정지',
        nextCard: '다음 슬라이드',
        previousCard: '이전 슬라이드',
        toggleWindow: '창 표시 / 숨기기',
        toggleClickThrough: '클릭 통과 켜기 / 끄기',
        change: '클릭한 다음 새 조합을 누르세요',
        pressKeys: '키를 누르세요…',
        taken: (action: string) => `이미 “${action}”에서 사용 중`,
        unavailable: '다른 앱이 이 조합을 사용 중입니다. 다른 조합을 고르세요',
        resetDefaults: '기본 단축키로 복원',
    },

    statusBar: {
        clickThroughOn: '클릭 통과 중',
    },

    updates: {
        available: (v: string) => `버전 ${v}을(를) 사용할 수 있습니다`,
        install: '지금 업데이트',
        installVersion: (v: string) => `${v} 설치`,
        later: '나중에',
        downloading: (p: number) => `업데이트 다운로드 중… ${p}%`,
        check: '업데이트 확인',
        checking: '확인 중…',
        upToDate: '최신 버전입니다',
        failed: '업데이트를 확인할 수 없습니다',
        autoCheck: '자동으로 업데이트 확인',
        version: (v: string) => `버전 ${v}`,
    },

    titleBar: {
        moveDown: '아래로 이동',
        moveUp: '위로 이동',
        minimize: '최소화',
        maximize: '최대화',
        close: '닫기',
    },

    tray: {
        show: '표시',
        hide: '숨기기',
        quit: '종료',
        clickThrough: '클릭 통과 전환',
    },

    canvas: {
        placeholder: '여기에 텍스트가 표시됩니다',
        editPlaceholder: '여기에 원고를 입력하거나 붙여넣으세요…',
    },

    textFiles: '텍스트',
    microphone: (id: string) => `마이크 ${id}`,

    errors: {
        unsupported: '음성 인식을 사용할 수 없습니다',
        microphone: '마이크에 접근할 수 없습니다',
        'not-allowed': '마이크 권한이 거부되었습니다',
        'service-not-allowed': '음성 서비스가 허용되지 않았습니다',
        'audio-capture': '마이크를 찾을 수 없습니다',
        'language-not-supported': '지원하지 않는 언어입니다',
        network: '네트워크 오류, 다시 시도하는 중…',
    },
}
