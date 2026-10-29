import { useEffect, useRef, useState } from 'react'
import type { Backdrop, Place, Surface } from '../lib/backdrop'
import { backdropWorker } from '../lib/backdropWorker'

// The softened backdrop, drawn behind the text like frosted glass
export interface Glass {
    url: string
    width: number
    height: number
}

// Lets go of a picture once whatever was fading from it is done
const retire = (url: string | null) => url && setTimeout(() => URL.revokeObjectURL(url), 1000)

// Hands what is behind the window to the worker: each new capture of the
// monitor once, then just where the window is (`place`) as it moves, so the
// worker cuts that part out without a new capture. The worker blurs it into
// frosted glass (by `soften`, 0-100) and keeps what the eye then sees behind
// the text for the letters' colors. `version` counts the views it has taken
// in; a view the same as the last one changes nothing, so the glass doesn't
// flicker. Requests that pile up while one is worked on collapse into the
// newest. `onAway` is told when the window has left the captured monitor.
export function useBackdropView(
    backdrop: Backdrop | null,
    place: Place | null,
    surface: Surface,
    soften: number,
    textColor: string,
    onAway: () => void,
) {
    const [view, setView] = useState<{ glass: Glass | null; version: number } | null>(null)
    const options = useRef({ surface, soften, textColor, onAway })
    options.current = { surface, soften, textColor, onAway }
    const busy = useRef(false)
    const queued = useRef(false)
    const latest = useRef({ backdrop, place })
    latest.current = { backdrop, place }
    // The capture the worker already has
    const sent = useRef<Backdrop | null>(null)
    const active = useRef(false)
    const glassUrl = useRef<string | null>(null)

    useEffect(() => {
        active.current = !!backdrop && !!place
        if (!backdrop || !place) {
            if (!backdrop) {
                backdropWorker.reset()
                sent.current = null
                retire(glassUrl.current)
                glassUrl.current = null
                setView(null)
            }
            return
        }
        const send = async () => {
            busy.current = true
            const { backdrop, place } = latest.current
            const { surface, soften, textColor } = options.current
            const fresh = backdrop !== sent.current ? backdrop : null
            sent.current = backdrop
            const reply = await backdropWorker.view({
                capture: fresh && { ...fresh, pixels: fresh.pixels.slice().buffer },
                place: place!,
                background: surface.background,
                opacity: surface.opacity,
                soften,
                textColor,
            })
            busy.current = false
            if (reply.type === 'away') options.current.onAway()
            if (active.current && reply.type === 'view') {
                const scale = window.devicePixelRatio
                retire(glassUrl.current)
                glassUrl.current = reply.glass ? URL.createObjectURL(reply.glass) : null
                const glass: Glass | null = glassUrl.current
                    ? {
                          url: glassUrl.current,
                          width: reply.cols * (reply.step / scale),
                          height: reply.rows * (reply.step / scale),
                      }
                    : null
                setView((v) => ({ glass, version: (v?.version ?? 0) + 1 }))
            }
            if (queued.current) {
                queued.current = false
                send()
            }
        }
        if (busy.current) queued.current = true
        else send()
    }, [backdrop, place])

    return view
}
