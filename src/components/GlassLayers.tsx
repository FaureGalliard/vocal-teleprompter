import { useEffect, useState } from 'react'
import type { Glass } from '../hooks/useBackdropView'

// How long a new picture of the glass takes to fade in over the last one
const FADE_MS = 400

// The frosted glass under everything in the frame. A new picture fades in
// over the one before, which stays until it is fully covered, so a change
// behind the window blends in instead of jumping. The whole glass fades out
// while the window moves, when its picture is out of date.
export default function GlassLayers({
    glass,
    shown,
    tint,
}: {
    glass: Glass
    shown: boolean
    // The window's background color, over the glass
    tint: string
}) {
    const [layers, setLayers] = useState<Glass[]>([glass])
    const [fresh, setFresh] = useState(false)

    useEffect(() => {
        setLayers((l) => (l[l.length - 1]?.url === glass.url ? l : [...l.slice(-1), glass]))
        setFresh(false)
        // Next frame: start the newest one's fade in
        const frame = requestAnimationFrame(() => setFresh(true))
        const done = setTimeout(() => setLayers((l) => l.slice(-1)), FADE_MS + 50)
        return () => {
            cancelAnimationFrame(frame)
            clearTimeout(done)
        }
    }, [glass])

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: shown ? 1 : 0, transition: 'opacity 0.25s ease' }}>
            {layers.map((layer, i) => {
                const newest = i === layers.length - 1
                return (
                    <div
                        key={layer.url}
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `linear-gradient(${tint}, ${tint}), url(${layer.url})`,
                            backgroundSize: `100% 100%, ${layer.width}px ${layer.height}px`,
                            backgroundRepeat: 'no-repeat',
                            opacity: newest && layers.length > 1 && !fresh ? 0 : 1,
                            transition: newest ? `opacity ${FADE_MS}ms ease` : undefined,
                        }}
                    />
                )
            })}
        </div>
    )
}
