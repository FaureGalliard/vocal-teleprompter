import { motion, AnimatePresence } from 'framer-motion'

interface CountdownOverlayProps {
    value: number | null
    color: string
    halo?: string
}

// Big 3, 2, 1 over the script before listening starts
export default function CountdownOverlay({ value, color, halo }: CountdownOverlayProps) {
    return (
        <div className="fixed inset-0 z-[45] flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="popLayout">
                {value !== null && (
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, scale: 1.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="font-bold tabular-nums leading-none"
                        style={{
                            fontSize: 'min(40vh, 40vw)',
                            color,
                            textShadow: halo ? `0 0 12px ${halo}` : undefined,
                        }}>
                        {value}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    )
}
