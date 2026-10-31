import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import type { Expansion } from '../hooks/useWindowExpansion'
import type { Glass } from '../hooks/useBackdropView'
import GlassLayers from './GlassLayers'

// The teleprompter itself. Its transform makes it the box that the
// fixed-position pieces inside are laid out in, so they stay put while the
// window grows around it for the toolbar.
export default function Frame({
    expansion,
    background,
    opacity,
    outline,
    glass,
    glassShown,
    onBottomEdge,
    children,
}: {
    expansion: Expansion | null
    background: string
    opacity: number
    outline: string
    // What is behind the window, softened, drawn under the background color
    glass: Glass | null
    glassShown: boolean
    // Drags the bottom edge, where it is not the window's (Linux)
    onBottomEdge?: ((down: PointerEvent<HTMLElement>) => void) | null
    children: ReactNode
}) {
    const size = expansion?.frame
    const tint = `color-mix(in srgb, ${background} ${opacity * 100}%, transparent)`
    return (
        <div
            style={
                {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: size ? size.width : '100vw',
                    height: size ? size.height : '100vh',
                    '--frame-h': size ? `${size.height}px` : '100vh',
                    transform: 'translateZ(0)',
                    overflow: 'hidden',
                    backgroundColor: tint,
                    transition: 'background-color 0.3s ease',
                    outline: `1px solid ${outline}`,
                    outlineOffset: '-1px',
                    boxSizing: 'border-box',
                } as CSSProperties
            }>
            {glass && (
                <GlassLayers
                    glass={glass}
                    shown={glassShown}
                    tint={tint}
                />
            )}
            {children}
            {onBottomEdge && size && (
                <div
                    onPointerDown={onBottomEdge}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 5,
                        cursor: 'ns-resize',
                        zIndex: 60,
                    }}
                />
            )}
        </div>
    )
}
