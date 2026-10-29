import { forwardRef } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useT } from '../i18n'
import { ArrowDownToLine, ArrowUpToLine, Minus, Square, X } from 'lucide-react'

export const TITLE_BAR_HEIGHT = 32

interface TitleBarProps {
    position: 'top' | 'bottom'
    onPositionChange: (pos: 'top' | 'bottom') => void
}

const TitleBar = forwardRef<HTMLDivElement, TitleBarProps>(
    ({ position, onPositionChange }, ref) => {
        const t = useT()
        return (
            <div
                className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}>
                <div
                    ref={ref}
                    data-tauri-drag-region
                    className="flex items-center justify-between pl-3 bg-[#1a1a1a] text-white select-none font-sans"
                    style={{ height: TITLE_BAR_HEIGHT }}>
                    <div className="flex items-center gap-2 pointer-events-none">
                        <span className="text-[11px] text-white/40 font-medium">{t.appName}</span>
                    </div>

                    <div className="flex items-center h-full">
                        <button
                            onClick={() => onPositionChange(position === 'top' ? 'bottom' : 'top')}
                            className="h-full px-3 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs"
                            title={position === 'top' ? t.titleBar.moveDown : t.titleBar.moveUp}>
                            {position === 'top' ? (
                                <ArrowDownToLine size={13} />
                            ) : (
                                <ArrowUpToLine size={13} />
                            )}
                        </button>

                        <div className="w-px h-3.5 bg-white/10" />

                        <button
                            onClick={() => getCurrentWindow().minimize()}
                            className="h-full px-3.5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            title={t.titleBar.minimize}>
                            <Minus size={14} />
                        </button>

                        <button
                            onClick={() => getCurrentWindow().toggleMaximize()}
                            className="h-full px-3.5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            title={t.titleBar.maximize}>
                            <Square size={11} />
                        </button>

                        <button
                            onClick={() => getCurrentWindow().close()}
                            className="h-full px-3.5 flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500 transition-all"
                            title={t.titleBar.close}>
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        )
    },
)

TitleBar.displayName = 'TitleBar'

export default TitleBar
