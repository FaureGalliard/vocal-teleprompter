import type { CSSProperties } from 'react'
import type { BackdropPaint } from '../hooks/useBackdropPaint'
import { PAINT_FADE } from '../lib/wordPaint'

// The window's edge, painted from the backdrop's color map like the text,
// so it shows over anything behind it; thin and a little faded, so it marks
// the edge without drawing the eye. New colors blend in, as the text's do.
export default function PaintedBorder({ paint }: { paint: BackdropPaint }) {
    const ring = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)'
    return (
        <div
            className="fixed inset-0 pointer-events-none"
            style={
                {
                    padding: 1,
                    opacity: 0.6,
                    backgroundImage: `url(${paint.url})`,
                    backgroundSize: `${paint.width}px ${paint.height}px`,
                    backgroundRepeat: 'no-repeat',
                    transition: PAINT_FADE,
                    // Only the ring between the padding box and the content
                    WebkitMask: ring,
                    WebkitMaskComposite: 'xor',
                    mask: ring,
                    maskComposite: 'exclude',
                } as CSSProperties
            }
        />
    )
}
