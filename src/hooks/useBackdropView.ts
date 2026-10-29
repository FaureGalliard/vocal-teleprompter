import { useEffect, useRef, useState } from 'react'
import type { Backdrop, Surface } from '../lib/backdrop'
import { backdropWorker } from '../lib/backdropWorker'

// The softened backdrop, drawn behind the text like frosted glass
export interface Glass {
    url: string
    width: number
    height: number
}

// Lets go of a picture once whatever was fading from it is done
const retire = (url: string | null) => url && setTimeout(() => URL.revokeObjectURL(url), 1000)

// Hands each look at the backdrop to the worker, which blurs it into frosted
// glass (by `soften`, 0-100) and keeps what the eye then sees behind the text
// for the letters' colors. `version` counts the looks it has taken in; a look
// the same as the last one changes nothing, so the glass doesn't flicker.
// Looks that come in while one is being worked on are dropped but the newest.
export function useBackdropView(backdrop: Backdrop | null, surface: Surface, soften: number) {
    const [view, setView] = useState<{ glass: Glass | null; version: number } | null>(null)
    const options = useRef({ surface, soften })
    options.current = { surface, soften }
    const busy = useRef(false)
    const queued = useRef<Backdrop | null>(null)
    const active = useRef(false)
    const glassUrl = useRef<string | null>(null)

    useEffect(() => {
        active.current = !!backdrop
        if (!backdrop) {
            backdropWorker.reset()
            retire(glassUrl.current)
            glassUrl.current = null
            setView(null)
            return
        }
        const send = async (look: Backdrop) => {
            busy.current = true
            const { surface, soften } = options.current
            const reply = await backdropWorker.view({
                cols: look.cols,
                rows: look.rows,
                step: look.step,
                pixels: look.pixels.slice().buffer,
                background: surface.background,
                opacity: surface.opacity,
                soften,
            })
            busy.current = false
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
            const next = queued.current
            queued.current = null
            if (next) send(next)
        }
        if (busy.current) queued.current = backdrop
        else send(backdrop)
    }, [backdrop])

    return view
}
