import { useState, useRef, useLayoutEffect } from 'react'
import TitleBar from './components/TitleBar'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'

function App() {
    const [bgOpacity, setBgOpacity] = useState(1)
    const [bgColor, setBgColor] = useState('#ffffff')
    const [textColor, setTextColor] = useState('#1a1a1a')
    const [titleBarPosition, setTitleBarPosition] = useState<'top' | 'bottom'>('top')
    const [titleBarVisible, setTitleBarVisible] = useState(true)
    const [toolbarVisible, setToolbarVisible] = useState(false)
    const [titleBarHeight, setTitleBarHeight] = useState(0)
    const [content, setContent] = useState('')
    const [fontSize, setFontSize] = useState(24)
    const titleBarRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        if (titleBarRef.current) {
            setTitleBarHeight(titleBarRef.current.offsetHeight)
        }
    }, [titleBarVisible, titleBarPosition])

    const handlePasteText = async () => {
        try {
            const text = await readText()
            if (text) setContent(text)
        } catch (e) {
            console.error('Error al leer clipboard:', e)
        }
    }

    const handleImport = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'Texto', extensions: ['txt'] }],
            })
            if (selected) {
                const text = await readTextFile(selected as string)
                setContent(text)
            }
        } catch (e) {
            console.error('Error al importar archivo:', e)
        }
    }

    const handleClear = () => setContent('')

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value)
        if (!isNaN(val) && val >= 6 && val <= 200) setFontSize(val)
        else if (e.target.value === '') setFontSize(6)
    }

    const canvasPaddingTop =
        titleBarVisible && titleBarPosition === 'top' ? titleBarHeight : 0
    const canvasPaddingBottom =
        titleBarVisible && titleBarPosition === 'bottom' ? titleBarHeight : 0

    return (
        <div
            className="font-sans"
            style={{
                height: '100vh',
                backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
            }}>
            {/* TitleBar fixed */}
            {titleBarVisible && (
                <TitleBar
                    ref={titleBarRef}
                    position={titleBarPosition}
                    onPositionChange={setTitleBarPosition}
                />
            )}

            {/* Toolbar fixed — siempre encima del canvas, no afecta su layout */}
            {toolbarVisible && (
                <div
                    className="fixed left-0 right-0 z-40 flex flex-wrap items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-white/10"
                    style={{
                        top:
                            titleBarVisible && titleBarPosition === 'top'
                                ? titleBarHeight
                                : 0,
                    }}>
                    <button
                        onClick={handlePasteText}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors">
                        + PEGAR TEXTO
                    </button>

                    <button
                        onClick={handleImport}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] transition-colors">
                        ↑ IMPORTAR
                    </button>

                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white bg-[#1a1a1a] text-white hover:bg-red-600 hover:border-red-600 transition-colors">
                        ✕ ELIMINAR
                    </button>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/60">TAMAÑO</span>
                        <input
                            type="number"
                            min={6}
                            max={200}
                            value={fontSize}
                            onChange={handleFontSizeChange}
                            className="w-12 px-1 py-0.5 text-[11px] text-white bg-transparent border border-white/40 text-center focus:outline-none focus:border-white"
                        />
                        <span className="text-[9px] text-white/40">px</span>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/60">FONDO</span>
                        <div className="relative w-5 h-5 border border-white/40">
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: bgColor }}
                            />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={bgOpacity}
                            onChange={(e) => setBgOpacity(Number(e.target.value))}
                            className="w-16 accent-white"
                        />
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-white/60">TEXTO</span>
                        <div className="relative w-5 h-5 border border-white/40">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: textColor }}
                            />
                        </div>
                    </div>

                    <div className="w-px h-5 mx-1 bg-white/20" />

                    <button
                        onClick={() => setTitleBarVisible((v) => !v)}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-white transition-colors ${
                            titleBarVisible
                                ? 'bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
                                : 'bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a]'
                        }`}>
                        {titleBarVisible ? '▲ OCULTAR BARRA' : '▼ MOSTRAR BARRA'}
                    </button>
                </div>
            )}

            {/* Botón ☰ fixed */}
            <button
                onClick={() => setToolbarVisible((v) => !v)}
                className="fixed z-50 w-8 h-8 flex items-center justify-center text-base bg-[#1a1a1a] text-white cursor-pointer hover:opacity-70 transition-opacity"
                style={{
                    top:
                        (titleBarVisible && titleBarPosition === 'top'
                            ? titleBarHeight
                            : 0) + 8,
                    right: 12,
                }}>
                ☰
            </button>

            {/* Canvas — padding solo por titleBar, nunca cambia por toolbar */}
            <div
                className="overflow-y-auto"
                style={{
                    height: '100vh',
                    paddingTop: canvasPaddingTop,
                    paddingBottom: canvasPaddingBottom,
                    boxSizing: 'border-box',
                }}>
                <div className="min-h-full flex items-center justify-center p-12">
                    {content ? (
                        <p
                            className="text-center whitespace-pre-wrap leading-relaxed w-full"
                            style={{ color: textColor, fontSize: `${fontSize}px` }}>
                            {content}
                        </p>
                    ) : (
                        <p
                            className="text-5xl text-center opacity-15"
                            style={{ color: textColor }}>
                            Tu texto aparecerá aquí
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App
