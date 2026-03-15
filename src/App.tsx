import { useState } from 'react'
import TitleBar from './components/TitleBar'

const TITLEBAR_HEIGHT = 40

function App() {
    const [bgOpacity, setBgOpacity] = useState(1)
    const [bgColor, setBgColor] = useState('#ffffff')
    const [textColor, setTextColor] = useState('#1a1a1a')
    const [titleBarPosition, setTitleBarPosition] = useState<'top' | 'bottom'>('top')
    const [titleBarVisible, setTitleBarVisible] = useState(true)
    const [toolbarVisible, setToolbarVisible] = useState(false)

    return (
        <div
            style={{
                fontFamily: "'Inter', sans-serif",
                minHeight: '100vh',
                paddingTop:
                    titleBarVisible && titleBarPosition === 'top' ? TITLEBAR_HEIGHT : 0,
                paddingBottom:
                    titleBarVisible && titleBarPosition === 'bottom'
                        ? TITLEBAR_HEIGHT
                        : 0,
                backgroundColor: `color-mix(in srgb, ${bgColor} ${bgOpacity * 100}%, transparent)`,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
            }}>
            {titleBarVisible && (
                <TitleBar
                    position={titleBarPosition}
                    onPositionChange={setTitleBarPosition}
                />
            )}

            {/* Botón ☰ fijo en esquina superior derecha */}
            <button
                onClick={() => setToolbarVisible((v) => !v)}
                style={{
                    position: 'fixed',
                    top:
                        titleBarVisible && titleBarPosition === 'top'
                            ? TITLEBAR_HEIGHT + 8
                            : 8,
                    right: 12,
                    zIndex: 40,
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    border: 'none',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                ☰
            </button>

            {/* Toolbar desplegable */}
            {toolbarVisible && (
                <div
                    className="flex flex-wrap items-center gap-2 px-4 py-2"
                    style={{
                        backgroundColor: '#1a1a1a',
                        color: '#ffffff',
                        borderBottom: '1px solid #ffffff15',
                    }}>
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all duration-150"
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#1a1a1a',
                            borderColor: '#ffffff',
                            letterSpacing: '0.06em',
                        }}
                        onMouseEnter={(e) => {
                            ;(
                                e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = '#1a1a1a'
                            ;(e.currentTarget as HTMLButtonElement).style.color =
                                '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                            ;(
                                e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = '#ffffff'
                            ;(e.currentTarget as HTMLButtonElement).style.color =
                                '#1a1a1a'
                        }}>
                        + AGREGAR TEXTO
                    </button>

                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all duration-150"
                        style={{
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            borderColor: '#ffffff',
                            letterSpacing: '0.06em',
                        }}
                        onMouseEnter={(e) => {
                            ;(
                                e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = '#ffffff'
                            ;(e.currentTarget as HTMLButtonElement).style.color =
                                '#1a1a1a'
                        }}
                        onMouseLeave={(e) => {
                            ;(
                                e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = '#1a1a1a'
                            ;(e.currentTarget as HTMLButtonElement).style.color =
                                '#ffffff'
                        }}>
                        ↑ IMPORTAR
                    </button>

                    <div
                        className="w-px h-5 mx-1"
                        style={{ backgroundColor: '#ffffff20' }}
                    />

                    <div className="flex items-center gap-1.5">
                        <span
                            style={{
                                color: '#ffffff60',
                                fontSize: '9px',
                                letterSpacing: '0.1em',
                            }}>
                            FONDO
                        </span>
                        <div
                            className="relative w-5 h-5 border"
                            style={{ borderColor: '#ffffff40' }}>
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
                            className="w-16"
                            style={{ accentColor: '#ffffff' }}
                        />
                    </div>

                    <div
                        className="w-px h-5 mx-1"
                        style={{ backgroundColor: '#ffffff20' }}
                    />

                    <div className="flex items-center gap-1.5">
                        <span
                            style={{
                                color: '#ffffff60',
                                fontSize: '9px',
                                letterSpacing: '0.1em',
                            }}>
                            TEXTO
                        </span>
                        <div
                            className="relative w-5 h-5 border"
                            style={{ borderColor: '#ffffff40' }}>
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

                    <div
                        className="w-px h-5 mx-1"
                        style={{ backgroundColor: '#ffffff20' }}
                    />

                    <button
                        onClick={() => setTitleBarVisible((v) => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all duration-150"
                        style={{
                            backgroundColor: titleBarVisible ? '#ffffff' : '#1a1a1a',
                            color: titleBarVisible ? '#1a1a1a' : '#ffffff',
                            borderColor: '#ffffff',
                            letterSpacing: '0.06em',
                        }}>
                        {titleBarVisible ? '▲ OCULTAR BARRA' : '▼ MOSTRAR BARRA'}
                    </button>
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-12">
                <p
                    style={{
                        color: textColor,
                        opacity: 0.15,
                        fontSize: '48px',
                        letterSpacing: '-0.02em',
                        textAlign: 'center',
                    }}>
                    Tu texto aparecerá aquí
                </p>
            </div>
        </div>
    )
}

export default App
