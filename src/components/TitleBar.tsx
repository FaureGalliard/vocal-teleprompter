import { useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

const win = getCurrentWindow()

export default function TitleBar() {
    const [position, setPosition] = useState<'top' | 'bottom'>('top')
    const [visible, setVisible] = useState(true)

    if (!visible) {
        return (
            <button
                onClick={() => setVisible(true)}
                className="fixed top-2 right-2 z-50 bg-gray-800 text-white px-2 py-1 rounded text-xs hover:bg-gray-600">
                ☰
            </button>
        )
    }

    return (
        <div
            className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}>
            <div
                data-tauri-drag-region
                className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white select-none">
                <span className="text-sm">Vocal Teleprompter</span>

                <div className="flex gap-2">
                    <button
                        onClick={() =>
                            setPosition((p) => (p === 'top' ? 'bottom' : 'top'))
                        }
                        className="hover:bg-gray-600 px-2 rounded text-xs">
                        {position === 'top' ? '↓' : '↑'}
                    </button>

                    <button
                        onClick={() => win.minimize()}
                        className="hover:bg-gray-600 px-2 rounded">
                        −
                    </button>

                    <button
                        onClick={() => win.toggleMaximize()}
                        className="hover:bg-gray-600 px-2 rounded">
                        □
                    </button>

                    <button
                        onClick={() => win.close()}
                        className="hover:bg-red-500 px-2 rounded">
                        ✕
                    </button>
                </div>
            </div>
        </div>
    )
}
