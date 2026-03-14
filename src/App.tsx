import { useState } from 'react'
import TitleBar from './components/TitleBar'
import { getCurrentWindow } from '@tauri-apps/api/window'
const toggleDecorations = async () => {
    const win = getCurrentWindow()
    const decorated = await win.isDecorated()
    await win.setDecorations(!decorated)
}
function App() {
    const [bgOpacity, setBgOpacity] = useState(1)
    const [bgColor, setBgColor] = useState('#ffffff')
    const [textColor, setTextColor] = useState('#1a1a1a')

    return (
        <div className="flex flex-col min-h-screen">
            <TitleBar />
            <main
                style={{
                    backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
                }}
                className="min-h-screen p-8">
                <h1 style={{ color: textColor }}>Bienvenido a vocal teleprompter</h1>

                <div className="flex items-center gap-4">
                    {/* Selector de color de fondo */}
                    <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                    />

                    {/* Opacidad del fondo */}
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={bgOpacity}
                        onChange={(e) => setBgOpacity(Number(e.target.value))}
                    />

                    {/* Color del texto */}
                    <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                    />
                </div>
            </main>
        </div>
    )
}

export default App
