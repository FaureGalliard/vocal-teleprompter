import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { Messages } from '../i18n/en'
import type { Settings } from './useSettings'

// Keeps the window and the tray in step with the settings: interface
// language, click-through (also toggled from the tray) and hiding from
// screen capture
export function useWindowBehavior(settings: Settings, t: Messages) {
    const { uiLanguage, clickThrough, setClickThrough, hiddenFromCapture } = settings

    useEffect(() => {
        document.documentElement.lang = uiLanguage
        invoke('set_tray_labels', { ...t.tray }).catch((e) => console.error(e))
    }, [uiLanguage, t])

    useEffect(() => {
        getCurrentWindow()
            .setIgnoreCursorEvents(clickThrough)
            .catch((e) => console.error(e))
    }, [clickThrough])

    useEffect(() => {
        const unlisten = listen('toggle-click-through', () => setClickThrough((v) => !v))
        return () => {
            unlisten.then((off) => off())
        }
    }, [setClickThrough])

    useEffect(() => {
        getCurrentWindow()
            .setContentProtected(hiddenFromCapture)
            .catch((e) => console.error(e))
    }, [hiddenFromCapture])
}
