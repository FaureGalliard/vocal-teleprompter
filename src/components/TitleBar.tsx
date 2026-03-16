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
                    className="flex items-center justify-between pl-3 bg-[#1a1a1a] text-white select-none font-sans"
                    style={{ height: '32px' }}>
                    {/* Izquierda — título */}
                    <div className="flex items-center gap-2 pointer-events-none">
                        <span className="text-[11px] text-white/40 font-medium">
                            Vocal Teleprompter
                        </span>
                    </div>

                    {/* Derecha — controles */}
                    <div className="flex items-center h-full">
                        {/* Mover posición */}
                        <button
                            onClick={() =>
                                onPositionChange(position === 'top' ? 'bottom' : 'top')
                            }
                            className="h-full px-3 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs"
                            title={position === 'top' ? 'Mover abajo' : 'Mover arriba'}>
                            {position === 'top' ? '↓' : '↑'}
                        </button>

                        <div className="w-px h-3.5 bg-white/10" />

                        {/* Minimizar */}
                        <button
                            onClick={() => win.minimize()}
                            className="h-full px-3.5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            title="Minimizar">
                            <svg
                                width="10"
                                height="1"
                                viewBox="0 0 10 1"
                                fill="currentColor">
                                <rect
                                    width="10"
                                    height="1"
                                />
                            </svg>
                        </button>

                        {/* Maximizar */}
                        <button
                            onClick={() => win.toggleMaximize()}
                            className="h-full px-3.5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            title="Maximizar">
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1">
                                <rect
                                    x="0.5"
                                    y="0.5"
                                    width="9"
                                    height="9"
                                />
                            </svg>
                        </button>

                        {/* Cerrar */}
                        <button
                            onClick={() => win.close()}
                            className="h-full px-3.5 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500 transition-all"
                            title="Cerrar">
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round">
                                <line
                                    x1="0"
                                    y1="0"
                                    x2="10"
                                    y2="10"
                                />
                                <line
                                    x1="10"
                                    y1="0"
                                    x2="0"
                                    y2="10"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        )
    },
)

TitleBar.displayName = 'TitleBar'

export default TitleBar
