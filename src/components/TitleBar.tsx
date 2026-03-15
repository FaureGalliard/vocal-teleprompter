import { forwardRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

const win = getCurrentWindow()

interface TitleBarProps {
    position: 'top' | 'bottom'
    onPositionChange: (pos: 'top' | 'bottom') => void
}

const TitleBar = forwardRef<HTMLDivElement, TitleBarProps>(
    ({ position, onPositionChange }, ref) => {
        return (
            <div
                className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}>
                <div
                    ref={ref}
                    data-tauri-drag-region
                    className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] text-white select-none font-sans">
                    <span className="text-xs opacity-60">Vocal Teleprompter</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() =>
                                onPositionChange(position === 'top' ? 'bottom' : 'top')
                            }
                            className="px-2 py-0.5 text-xs hover:opacity-50 transition-opacity">
                            {position === 'top' ? '↓' : '↑'}
                        </button>
                        <button
                            onClick={() => win.minimize()}
                            className="px-2 py-0.5 text-xs hover:opacity-50 transition-opacity">
                            −
                        </button>
                        <button
                            onClick={() => win.toggleMaximize()}
                            className="px-2 py-0.5 text-xs hover:opacity-50 transition-opacity">
                            □
                        </button>
                        <button
                            onClick={() => win.close()}
                            className="px-2 py-0.5 text-xs hover:bg-red-600 transition-colors">
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        )
    },
)

TitleBar.displayName = 'TitleBar'

export default TitleBar
