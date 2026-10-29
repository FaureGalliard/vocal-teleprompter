import { useEffect } from 'react'

const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement

// Keyboard shortcuts while the window has the focus, ignored while typing in
// a field, editing the script or following the tour
export function useWindowKeys({
    disabled,
    onToggleListening,
    onStop,
    onMove,
    onPage,
    onTextSize,
}: {
    disabled: boolean
    onToggleListening: () => void
    // Returns false when there was nothing to stop
    onStop: () => boolean
    // By this many words
    onMove: (words: number) => void
    // To the next or previous slide card
    onPage: (direction: 1 | -1) => void
    onTextSize: (change: number) => void
}) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || disabled) return
            switch (e.key) {
                case ' ':
                    onToggleListening()
                    break
                case 'Escape':
                    if (!onStop()) return
                    break
                case 'ArrowRight':
                case 'ArrowDown':
                    onMove(1)
                    break
                case 'ArrowLeft':
                case 'ArrowUp':
                    onMove(-1)
                    break
                case 'PageDown':
                    onPage(1)
                    break
                case 'PageUp':
                    onPage(-1)
                    break
                case '+':
                case '=':
                    onTextSize(2)
                    break
                case '-':
                    onTextSize(-2)
                    break
                default:
                    return
            }
            e.preventDefault()
        }

        // Keep Space from also clicking whatever button has focus
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ' && !isTyping(e.target)) e.preventDefault()
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    })
}
