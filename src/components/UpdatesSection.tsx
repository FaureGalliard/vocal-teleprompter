import { RefreshCw } from 'lucide-react'
import { useT } from '../i18n'
import type { useUpdater } from '../hooks/useUpdater'
import Switch from './Switch'
import { Row } from './SettingsRows'

// Automatic update checks, the current version, and checking or installing by hand
export default function UpdatesSection({
    autoUpdate,
    onToggleAutoUpdate,
    updater,
}: {
    autoUpdate: boolean
    onToggleAutoUpdate: () => void
    updater: ReturnType<typeof useUpdater>
}) {
    const t = useT()
    return (
        <div className="border-t border-white/10">
            <Row
                icon={<RefreshCw size={14} />}
                label={t.updates.autoCheck}
                hint={
                    updater.currentVersion ? t.updates.version(updater.currentVersion) : undefined
                }>
                <Switch
                    on={autoUpdate}
                    onToggle={onToggleAutoUpdate}
                />
            </Row>
            <div className="flex items-center gap-3 px-4 pb-2.5 -mt-1">
                {updater.status === 'available' ? (
                    <button
                        onClick={updater.install}
                        className="text-[11px] px-3 py-1 rounded-full bg-[#445ade] hover:bg-[#3448c5] text-white transition-colors">
                        {t.updates.installVersion(updater.newVersion ?? '')}
                    </button>
                ) : (
                    <button
                        onClick={updater.checkForUpdates}
                        disabled={updater.status === 'checking' || updater.status === 'downloading'}
                        className="text-[11px] px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 transition-colors">
                        {t.updates.check}
                    </button>
                )}
                <span className="text-[10px] text-white/40">
                    {updater.status === 'checking' && t.updates.checking}
                    {updater.status === 'up-to-date' && t.updates.upToDate}
                    {updater.status === 'failed' && t.updates.failed}
                    {updater.status === 'downloading' &&
                        t.updates.downloading(Math.round(updater.progress * 100))}
                </span>
            </div>
        </div>
    )
}
