import { createContext, useContext, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Which way the toolbar's menus, panels and tooltips open: into the room
// below the toolbar, or above it when the toolbar sits over the bottom edge
// of the teleprompter (maximized window)
export type OpenTowards = 'down' | 'up'
export const OpenTowardsContext = createContext<OpenTowards>('up')
export const useOpenTowards = () => useContext(OpenTowardsContext)

const GAP = 8

// Label shown beside a toolbar control on hover, on the side its panels
// open to; the control's wrapper needs the `group` class
export function BarTooltip({ label, hidden }: { label: string; hidden?: boolean }) {
    const towards = useOpenTowards()
    if (hidden) return null
    return (
        <span
            className={`absolute left-1/2 -translate-x-1/2 ${towards === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} z-50 px-2 py-1 rounded-md bg-[#0d0d0d] border border-white/10 text-[11px] text-white whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150`}>
            {label}
        </span>
    )
}

// Menu or panel hanging off a toolbar button, centered on it and kept inside
// the window. It lives in a portal so the toolbar fading out (while a
// control is dragged) leaves it visible, and scrolls when it does not fit.
export function Popover({
    anchor,
    open,
    width,
    panelRef,
    className = '',
    children,
}: {
    anchor: RefObject<HTMLElement | null>
    open: boolean
    width: number
    panelRef?: RefObject<HTMLDivElement | null>
    className?: string
    children: ReactNode
}) {
    const towards = useOpenTowards()
    const [place, setPlace] = useState<React.CSSProperties | null>(null)

    useLayoutEffect(() => {
        const rect = anchor.current?.getBoundingClientRect()
        if (!open || !rect) return
        const left = Math.max(GAP, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - GAP))
        setPlace(
            towards === 'down'
                ? { left, top: rect.bottom + GAP, maxHeight: window.innerHeight - rect.bottom - 2 * GAP }
                : { left, bottom: window.innerHeight - rect.top + GAP, maxHeight: rect.top - 2 * GAP },
        )
    }, [open, towards, width, anchor])

    const shift = towards === 'down' ? -6 : 6
    return createPortal(
        <AnimatePresence>
            {open && place && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: shift, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: shift, scale: 0.97 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    style={{ position: 'fixed', width, ...place, zIndex: 9999 }}
                    className={`overflow-y-auto bg-[#242424] border border-white/10 rounded-xl shadow-xl ${className}`}>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}
