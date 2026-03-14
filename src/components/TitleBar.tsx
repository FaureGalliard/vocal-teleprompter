import { getCurrentWindow } from '@tauri-apps/api/window'

const win = getCurrentWindow()

export default function TitleBar() {
    return (
        <div
            data-tauri-drag-region
            className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white select-none">
            <span className="text-sm">Vocal Teleprompter</span>

            <div className="flex gap-2">
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
    )
}
