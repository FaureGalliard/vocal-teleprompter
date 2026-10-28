import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface DownloadProgress {
    language: string
    received: number
    total: number
}

// Whether the speech model for a language is installed, and downloading it
export function useSpeechModel(language: string) {
    const [installed, setInstalled] = useState<boolean | null>(null)
    const [downloading, setDownloading] = useState(false)
    const [received, setReceived] = useState(0)
    const [total, setTotal] = useState(0)
    const [failed, setFailed] = useState(false)
    // A download that finishes after the language changed must not mark the
    // new language as installed
    const languageRef = useRef(language)

    useEffect(() => {
        languageRef.current = language
        setDownloading(false)
        setInstalled(null)
        setFailed(false)
        invoke<{ installed: boolean }>('speech_model_status', { language })
            .then((s) => setInstalled(s.installed))
            .catch(() => setInstalled(false))
    }, [language])

    useEffect(() => {
        const unlisten = listen<DownloadProgress>('model-download', ({ payload }) => {
            if (payload.language !== language) return
            setReceived(payload.received)
            setTotal(payload.total)
        })
        return () => {
            unlisten.then((off) => off())
        }
    }, [language])

    // Resolves true once the model is ready to use
    const download = useCallback(async () => {
        setDownloading(true)
        setFailed(false)
        setReceived(0)
        setTotal(0)
        const current = () => languageRef.current === language
        try {
            await invoke('download_speech_model', { language })
            if (current()) setInstalled(true)
            return current()
        } catch (e) {
            console.error('Speech model download failed:', e)
            if (current()) setFailed(true)
            return false
        } finally {
            if (current()) setDownloading(false)
        }
    }, [language])

    return { installed, downloading, received, total, failed, download }
}
