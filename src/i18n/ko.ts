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
