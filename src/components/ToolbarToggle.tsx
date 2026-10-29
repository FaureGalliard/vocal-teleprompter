import { useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Menu, X } from 'lucide-react'
import { useT } from '../i18n'

// Round button in the bottom corner, in the status row and clear of the
// text: a click opens or closes the toolbar, holding it drags the window
export default function ToolbarToggle({
    open,
    onToggle,
    bottom,
}: {
    open: boolean
    onToggle: () => void
    bottom: number
}) {
    const t = useT()
    const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isDraggingRef = useRef(false)

    const onMouseDown = () => {
        isDraggingRef.current = false
        dragTimeoutRef.current = setTimeout(() => {
            isDraggingRef.current = true
            getCurrentWindow()
                .startDragging()
                .catch((e) => console.error(e))
        }, 120)
    }

    const onMouseUp = () => {
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
        dragTimeoutRef.current = null
    }

    return (
        <button
            data-tour="menu"
            aria-label={t.tour.menuTitle}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onClick={() => !isDraggingRef.current && onToggle()}
            className={`fixed z-50 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors shadow-lg ${
                open
                    ? 'bg-[#445ade] text-white hover:bg-[#3448c5]'
                    : 'bg-[#1a1a1a] text-white hover:bg-[#3448c5]'
            }`}
            style={{ bottom, right: 10 }}>
            {open ? <X size={14} /> : <Menu size={14} />}
        </button>
    )
}
