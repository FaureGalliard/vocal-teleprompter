import { getCurrentWindow } from '@tauri-apps/api/window'

const win = getCurrentWindow()

interface TitleBarProps {
    position: 'top' | 'bottom'
    onPositionChange: (pos: 'top' | 'bottom') => void
}

export default function TitleBar({ position, onPositionChange }: TitleBarProps) {
    return (
        <div
            className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}>
            <div
                data-tauri-drag-region
                className="flex items-center justify-between px-4 py-2 select-none"
                style={{
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: "'Inter', sans-serif",
                }}>
                <span style={{ fontSize: '11px', letterSpacing: '0.08em', opacity: 0.6 }}>
                    VOCAL TELEPROMPTER
                </span>

                <div className="flex gap-1">
                    <button
                        onClick={() =>
                            onPositionChange(position === 'top' ? 'bottom' : 'top')
                        }
                        className="px-2 py-0.5 text-xs transition-all"
                        style={{ fontSize: '11px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                        {position === 'top' ? '↓' : '↑'}
                    </button>
                    <button
                        onClick={() => win.minimize()}
                        className="px-2 py-0.5 text-xs transition-all"
                        style={{ fontSize: '11px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                        −
                    </button>
                    <button
                        onClick={() => win.toggleMaximize()}
                        className="px-2 py-0.5 text-xs transition-all"
                        style={{ fontSize: '11px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                        □
                    </button>
                    <button
                        onClick={() => win.close()}
                        className="px-2 py-0.5 text-xs transition-all"
                        style={{ fontSize: '11px' }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#cc0000')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                        }>
                        ✕
                    </button>
                </div>
            </div>
        </div>
    )
}
