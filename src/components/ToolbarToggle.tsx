import { useRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Menu, X } from 'lucide-react'
import { useT } from '../i18n'

// Round button in the bottom corner, in the status row and clear of the
// text: a click opens or closes the toolbar, dragging it moves the window
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
    const isDraggingRef = useRef(false)

    // Dragging starts once the mouse moves a few pixels with the button down,
    // not after a delay: a slow click is still a click, and where the window
    // manager takes over the mouse for the drag the release is never heard
    const onMouseDown = (down: React.MouseEvent) => {
        isDraggingRef.current = false
        const { clientX, clientY } = down
        const onMove = (e: MouseEvent) => {
            if (Math.hypot(e.clientX - clientX, e.clientY - clientY) < 4) return
            stop()
            isDraggingRef.current = true
            getCurrentWindow()
                .startDragging()
                .catch((err) => console.error(err))
        }
        const stop = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', stop)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', stop)
    }

    return (
        <button
            data-tour="menu"
            aria-label={t.tour.menuTitle}
            onMouseDown={onMouseDown}
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
