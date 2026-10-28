import { motion, AnimatePresence } from 'framer-motion'
import { Download, RotateCcw } from 'lucide-react'
import { useT } from '../i18n'

interface ModelDownloadCardProps {
    // Name of the language whose model is missing
    language: string
    downloading: boolean
    failed: boolean
    received: number
    total: number
    onRetry: () => void
}

const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(0)

// Center card shown while a speech language's model downloads, so it is
// obvious why the prompter is not listening yet
export default function ModelDownloadCard({
    language,
    downloading,
    failed,
    received,
    total,
    onRetry,
}: ModelDownloadCardProps) {
    const t = useT()
    const progress = total > 0 ? received / total : 0

    return (
        <AnimatePresence>
            {(downloading || failed) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="fixed inset-0 z-[45] flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto w-80 max-w-[85vw] p-5 flex flex-col gap-3 rounded-2xl bg-[#242424]/95 border border-white/10 shadow-2xl text-white">
                        <div className="flex items-center gap-2">
                            <Download
                                size={16}
                                className={failed ? 'text-red-400' : 'text-[#7698fe]'}
                            />
                            <span className="text-[13px] font-medium">
                                {failed ? t.speechModel.failedTitle : t.speechModel.title(language)}
                            </span>
                        </div>
                        <span className="text-[11px] text-white/50 leading-snug">
                            {failed ? t.speechModel.failed : t.speechModel.hint}
                        </span>
                        {failed ? (
                            <button
                                onClick={onRetry}
                                className="flex items-center justify-center gap-1.5 h-8 rounded-full bg-[#445ade] hover:bg-[#3448c5] text-[12px] transition-colors">
                                <RotateCcw size={12} />
                                {t.speechModel.retry}
                            </button>
                        ) : (
                            <>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-[#445ade] transition-[width] duration-300"
                                        style={{ width: `${Math.round(progress * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-white/50 tabular-nums">
                                    <span>{Math.round(progress * 100)}%</span>
                                    {total > 0 && (
                                        <span>
                                            {mb(received)} / {mb(total)} MB
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
