import type { CSSProperties, ReactNode } from 'react'
import type { Expansion } from '../hooks/useWindowExpansion'

// The teleprompter itself. Its transform makes it the box that the
// fixed-position pieces inside are laid out in, so they stay put while the
// window grows around it for the toolbar.
export default function Frame({
    expansion,
    background,
    opacity,
    outline,
    children,
}: {
    expansion: Expansion | null
    background: string
    opacity: number
    outline: string
    children: ReactNode
}) {
    const size = expansion?.frame
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
                    backgroundColor: `color-mix(in srgb, ${background} ${opacity * 100}%, transparent)`,
                    outline: `1px solid ${outline}`,
                    outlineOffset: '-1px',
                    boxSizing: 'border-box',
                } as CSSProperties
            }>
            {children}
        </div>
    )
}
