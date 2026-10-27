import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useT } from '../i18n'

interface UpdateBannerProps {
    visible: boolean
    top: number
    version: string | null
    downloading: boolean
    progress: number
    onInstall: () => void
    onDismiss: () => void
}

// Discreet notice at the top when a new version is out
export default function UpdateBanner({
    visible,
    top,
    version,
    downloading,
    progress,
    onInstall,
    onDismiss,
}: UpdateBannerProps) {
    const t = useT()

    return (
        <AnimatePresence>
            {visible && version && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 pl-3 pr-1 h-8 rounded-full bg-[#242424] border border-white/10 shadow-xl text-[11px] text-white"
                    style={{ top }}>
                    <Download
                        size={13}
                        className="text-[#7698fe]"
                    />
                    {downloading ? (
                        <span className="pr-2 tabular-nums">
                            {t.updates.downloading(Math.round(progress * 100))}
                        </span>
                    ) : (
                        <>
                            <span>{t.updates.available(version)}</span>
                            <button
                                onClick={onInstall}
                                className="px-3 h-6 rounded-full bg-[#445ade] hover:bg-[#3448c5] transition-colors font-medium">
                                {t.updates.install}
                            </button>
                            <button
                                onClick={onDismiss}
                                title={t.updates.later}
                                className="flex items-center justify-center w-6 h-6 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                                <X size={13} />
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
