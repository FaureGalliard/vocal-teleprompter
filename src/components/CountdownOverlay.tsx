import { motion, AnimatePresence } from 'framer-motion'

interface CountdownOverlayProps {
    value: number | null
    color: string
    halo?: string
}

const SIZE = 132
const STROKE = 2
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// A light 3, 2, 1 inside a thin ring that empties each second, shown over
// the script before listening starts
export default function CountdownOverlay({ value, color, halo }: CountdownOverlayProps) {
    return (
        <AnimatePresence>
            {value !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[45] flex items-center justify-center pointer-events-none">
                    <div
                        className="relative flex items-center justify-center"
                        style={{ width: SIZE, height: SIZE }}>
                        <svg
                            width={SIZE}
                            height={SIZE}
                            className="absolute inset-0 -rotate-90">
                            <circle
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                fill="none"
                                stroke={color}
                                strokeOpacity={0.15}
                                strokeWidth={STROKE}
                            />
                            <motion.circle
                                key={value}
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                fill="none"
                                stroke={color}
                                strokeWidth={STROKE}
                                strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                initial={{ strokeDashoffset: 0 }}
                                animate={{ strokeDashoffset: CIRCUMFERENCE }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </svg>
                        <AnimatePresence mode="popLayout">
                            <motion.span
                                key={value}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="tabular-nums leading-none"
                                style={{
                                    fontSize: 56,
                                    fontWeight: 200,
                                    color,
                                    textShadow: halo ? `0 0 6px ${halo}` : undefined,
                                }}>
                                {value}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
