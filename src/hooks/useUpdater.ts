import { useState, useEffect, useRef, useCallback } from 'react'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { getVersion } from '@tauri-apps/api/app'

export type UpdateStatus =
    'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'failed'

// Leave the app a moment to settle before reaching out on launch
const STARTUP_CHECK_DELAY_MS = 3000

export function useUpdater(checkOnLaunch: boolean) {
    const [status, setStatus] = useState<UpdateStatus>('idle')
    const [currentVersion, setCurrentVersion] = useState('')
    const [newVersion, setNewVersion] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [dismissed, setDismissed] = useState(false)
    const updateRef = useRef<Update | null>(null)

    useEffect(() => {
        getVersion()
            .then(setCurrentVersion)
            .catch(() => {})
    }, [])

    const checkForUpdates = useCallback(async () => {
        setStatus('checking')
        try {
            const update = await check()
            updateRef.current = update
            if (update) {
                setNewVersion(update.version)
                setDismissed(false)
                setStatus('available')
            } else {
                setStatus('up-to-date')
            }
        } catch (e) {
            console.error('Update check failed:', e)
            setStatus('failed')
        }
    }, [])

    useEffect(() => {
        if (!checkOnLaunch) return
        const id = setTimeout(checkForUpdates, STARTUP_CHECK_DELAY_MS)
        return () => clearTimeout(id)
        // Only on launch, not when the setting is flipped later
    }, [])

    const install = useCallback(async () => {
        const update = updateRef.current
        if (!update) return
        setStatus('downloading')
        setProgress(0)
        let total = 0
        let received = 0
        try {
            await update.downloadAndInstall((event) => {
                if (event.event === 'Started') total = event.data.contentLength ?? 0
                if (event.event === 'Progress') {
                    received += event.data.chunkLength
                    if (total > 0) setProgress(Math.min(1, received / total))
                }
            })
            // On Windows the installer closes the app itself; elsewhere restart
            await relaunch()
        } catch (e) {
            console.error('Update failed:', e)
            setStatus('failed')
        }
    }, [])

    return {
        status,
        currentVersion,
        newVersion,
        progress,
        // The banner shows until dismissed; Settings can still install it
        showBanner: (status === 'available' || status === 'downloading') && !dismissed,
        dismiss: () => setDismissed(true),
        checkForUpdates,
        install,
    }
}
