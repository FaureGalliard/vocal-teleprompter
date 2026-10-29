import type { ReactNode } from 'react'
import { BarTooltip } from './Popover'

export const ICON = 14

export const iconBtn = 'flex items-center justify-center w-8 h-8 rounded-full transition-colors'
export const primary = 'bg-[#445ade] text-white hover:bg-[#3448c5]'
export const ghost = 'bg-white/10 text-white hover:bg-white/20'

// Round toolbar button with its name shown on hover
export default function BarButton({
    label,
    onClick,
    className,
    disabled,
    children,
    tour,
}: {
    label: string
    onClick: () => void
    className: string
    disabled?: boolean
    children: ReactNode
    tour?: string
}) {
    return (
        <div
            className="relative group"
            data-tour={tour}>
            <button
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={`${iconBtn} ${className} disabled:opacity-30 disabled:cursor-not-allowed`}>
                {children}
            </button>
            <BarTooltip label={label} />
        </div>
    )
}
