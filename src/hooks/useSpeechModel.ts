import { useState, useEffect, useCallback } from 'react'
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
    const [progress, setProgress] = useState(0)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        setInstalled(null)
        setFailed(false)
        invoke<{ installed: boolean }>('speech_model_status', { language })
            .then((s) => setInstalled(s.installed))
            .catch(() => setInstalled(false))
    }, [language])

    useEffect(() => {
        const unlisten = listen<DownloadProgress>('model-download', ({ payload }) => {
            if (payload.language === language && payload.total > 0)
                setProgress(payload.received / payload.total)
        })
        return () => {
            unlisten.then((off) => off())
        }
    }, [language])

    // Resolves true once the model is ready to use
    const download = useCallback(async () => {
        setDownloading(true)
        setFailed(false)
        setProgress(0)
        try {
            await invoke('download_speech_model', { language })
            setInstalled(true)
            return true
        } catch (e) {
            console.error('Speech model download failed:', e)
            setFailed(true)
            return false
        } finally {
            setDownloading(false)
        }
    }, [language])

    return { installed, downloading, progress, failed, download }
}
