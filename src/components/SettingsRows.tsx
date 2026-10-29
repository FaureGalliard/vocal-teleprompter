import type { ReactNode } from 'react'

export const selectClass =
    'bg-white/10 text-white text-[11px] rounded-md px-2 py-1 outline-none cursor-pointer'

// One setting: icon, name, an optional hint, and its control on the right
export function Row({
    icon,
    label,
    hint,
    children,
}: {
    icon: ReactNode
    label: string
    hint?: string
    children: ReactNode
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-white/50 flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white">{label}</div>
                {hint && <div className="text-[10px] text-white/40 leading-snug">{hint}</div>}
            </div>
            {children}
        </div>
    )
}

// Heading that groups the rows under it
export function Section({ title, first }: { title: string; first?: boolean }) {
    return (
        <div
            className={`px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-white/40 ${
                first ? '' : 'mt-1 border-t border-white/10'
            }`}>
            {title}
        </div>
    )
}
