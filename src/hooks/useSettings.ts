import { useCallback, useState } from 'react'
import { LANGUAGES } from '../constants/languages'
import { DEFAULT_UI_LANGUAGE } from '../i18n'
import { DEFAULT_SCROLLING, type Scrolling } from '../lib/scrolling'
import { DEFAULT_TYPOGRAPHY, type Typography } from '../lib/typography'
import { GLOBAL_SHORTCUTS, type GlobalAction } from './useGlobalShortcuts'
import { usePersistentState } from './usePersistentState'

// Speech language matching the system's, so a first run listens in the
// language the user most likely speaks
const systemSpeechLanguage =
    LANGUAGES.find((l) => l.value.split('-')[0] === navigator.language.split('-')[0])?.value ??
    'en-US'

// Everything the user sets up, remembered between sessions (click-through
// aside, which a restart always turns off)
export function useSettings() {
    const [uiLanguage, setUiLanguage] = usePersistentState<string>(
        'uiLanguage',
        DEFAULT_UI_LANGUAGE,
    )
    const [language, setLanguage] = usePersistentState<string>('language', systemSpeechLanguage)
    // null listens to the system default input
    const [selectedMic, setSelectedMic] = usePersistentState<string | null>('microphoneId', null)

    const [bgOpacity, setBgOpacity] = usePersistentState('bgOpacity', 0)
    // How much what is behind a see-through window is blurred, 0-100
    const [backdropSoften, setBackdropSoften] = usePersistentState('backdropSoften', 50)
    const [bgColor, setBgColor] = usePersistentState('bgColor', '#0a0000')
    const [textColor, setTextColor] = usePersistentState('textColor', '#7698fe')
    const [autoContrast, setAutoContrast] = usePersistentState('autoContrast', true)
    const [fontSize, setFontSize] = usePersistentState('fontSize', 16)
    const [typography, setTypography] = usePersistentState<Typography>(
        'typography',
        DEFAULT_TYPOGRAPHY,
    )

    const [titleBarPosition, setTitleBarPosition] = usePersistentState<'top' | 'bottom'>(
        'titleBarPosition',
        'top',
    )
    const [titleBarVisible, setTitleBarVisible] = usePersistentState('titleBarVisible', true)
    // Keep the window out of screen shares and recordings (Zoom, Meet, OBS...)
    const [hiddenFromCapture, setHiddenFromCapture] = usePersistentState('hiddenFromCapture', true)
    // Clicks go to whatever is behind the window. Not saved, so a restart
    // always brings the window back to normal
    const [clickThrough, setClickThrough] = useState(false)

    // Minutes the speaker wants the presentation to last; 0 means no target
    const [targetMinutes, setTargetMinutes] = usePersistentState('targetMinutes', 0)
    const [readingLine, setReadingLine] = usePersistentState('readingLine', false)
    const [scrolling, setScrolling] = usePersistentState<Scrolling>('scrolling', DEFAULT_SCROLLING)
    // Seconds counted down before listening starts; 0 starts right away
    const [countdownSeconds, setCountdownSeconds] = usePersistentState('countdownSeconds', 3)

    const [tourSeen, setTourSeen] = usePersistentState('tourSeen', false)
    const [autoUpdate, setAutoUpdate] = usePersistentState('autoUpdate', true)
    const [aiConnectorEnabled, setAiConnectorEnabled] = usePersistentState('aiConnector', true)

    const [shortcutsEnabled, setShortcutsEnabled] = usePersistentState('shortcutsEnabled', true)
    // Only the rebound ones are saved, so new defaults reach everyone else
    const [shortcutOverrides, setShortcutOverrides] = usePersistentState<
        Partial<Record<GlobalAction, string>>
    >('shortcutOverrides', {})
    const shortcutBindings = { ...GLOBAL_SHORTCUTS, ...shortcutOverrides }
    const setShortcut = useCallback(
        (action: GlobalAction, accelerator: string) =>
            setShortcutOverrides((o) =>
                accelerator === GLOBAL_SHORTCUTS[action]
                    ? Object.fromEntries(Object.entries(o).filter(([a]) => a !== action))
                    : { ...o, [action]: accelerator },
            ),
        [setShortcutOverrides],
    )
    const resetShortcuts = useCallback(() => setShortcutOverrides({}), [setShortcutOverrides])

    return {
        uiLanguage,
        setUiLanguage,
        language,
        setLanguage,
        selectedMic,
        setSelectedMic,
        bgOpacity,
        setBgOpacity,
        backdropSoften,
        setBackdropSoften,
        bgColor,
        setBgColor,
        textColor,
        setTextColor,
        autoContrast,
        setAutoContrast,
        fontSize,
        setFontSize,
        typography,
        setTypography,
        titleBarPosition,
        setTitleBarPosition,
        titleBarVisible,
        setTitleBarVisible,
        hiddenFromCapture,
        setHiddenFromCapture,
        clickThrough,
        setClickThrough,
        targetMinutes,
        setTargetMinutes,
        readingLine,
        setReadingLine,
        scrolling,
        setScrolling,
        countdownSeconds,
        setCountdownSeconds,
        tourSeen,
        setTourSeen,
        autoUpdate,
        setAutoUpdate,
        aiConnectorEnabled,
        setAiConnectorEnabled,
        shortcutsEnabled,
        setShortcutsEnabled,
        shortcutBindings,
        setShortcut,
        resetShortcuts,
    }
}

export type Settings = ReturnType<typeof useSettings>
