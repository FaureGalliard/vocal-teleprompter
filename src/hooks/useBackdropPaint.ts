import { useEffect, useRef, useState, type RefObject } from 'react'
import { backdropWorker } from '../lib/backdropWorker'
import type { Letter } from '../lib/letterPaint'

// A picture of the text color for every point of the window, and where each
// piece of text sits on it (by its `data-at` offset), so the text can be
// painted from it
export interface BackdropPaint {
    url: string
    width: number
    height: number
    offsets: Map<number, [number, number]>
    // Each letter's own color, by its offset in the script, kept for letters
    // that scrolled out of view too, so the editor can start from them
    letters: Map<number, string>
}

// Where every piece of text in view sits, in CSS pixels from the window's corner
function measure(root: HTMLElement) {
    const view = root.getBoundingClientRect()
    const pieces: { at: number; left: number; top: number; right: number; bottom: number }[] = []
    for (const span of root.querySelectorAll<HTMLElement>('[data-at]')) {
        const { left, top, right, bottom } = span.getBoundingClientRect()
        if (bottom < view.top || top > view.bottom) continue
        pieces.push({ at: Number(span.dataset.at), left, top, right, bottom })
    }
    return pieces
}

// Every visible letter's box, keyed by its offset in the script
function letters(root: HTMLElement) {
    const view = root.getBoundingClientRect()
    const range = document.createRange()
    const found: Letter[] = []
    for (const span of root.querySelectorAll<HTMLElement>('[data-at]')) {
        const box = span.getBoundingClientRect()
        if (box.bottom < view.top || box.top > view.bottom) continue
        const text = span.firstChild
        if (!(text instanceof Text)) continue
        const at = Number(span.dataset.at)
        for (let i = 0; i < text.length; i++) {
            if (/\s/.test(text.data[i])) continue
            range.setStart(text, i)
            range.setEnd(text, i + 1)
            const { left, top, right, bottom } = range.getBoundingClientRect()
            found.push({ key: at + i, left, top, right, bottom })
        }
    }
    return found
}

const retire = (url: string | null) => url && setTimeout(() => URL.revokeObjectURL(url), 1000)

// Colors the text in `container` over each new look at the backdrop
// (`version`, null when there is none): this thread only measures where the
// pieces and letters sit, and the worker works out every color. Rounds that
// come in while one is being worked on wait, and only the last of them runs.
export function useBackdropPaint(
    container: RefObject<HTMLElement | null>,
    version: number | null,
    // Used over gray areas, which have no hue to work from
    textColor: string,
    // Changes when the text is laid out anew (typing), to paint it again
    layout: unknown,
): BackdropPaint | null {
    const [paint, setPaint] = useState<BackdropPaint | null>(null)
    const color = useRef(textColor)
    color.current = textColor
    const busy = useRef(false)
    const queued = useRef(false)
    const active = useRef(false)
    const mapUrl = useRef<string | null>(null)
    // Bumped after scrolling, to paint the letters where they now are
    const [scrolled, setScrolled] = useState(0)

    useEffect(() => {
        const root = container.current
        active.current = version !== null && !!root
        if (!active.current || !root) {
            retire(mapUrl.current)
            mapUrl.current = null
            setPaint(null)
            return
        }
        const round = async () => {
            busy.current = true
            const pieces = measure(root)
            const scale = window.devicePixelRatio
            const reply = await backdropWorker.paint({
                letters: letters(root),
                textColor: color.current,
                scale,
            })
            busy.current = false
            if (active.current && reply.map) {
                retire(mapUrl.current)
                mapUrl.current = URL.createObjectURL(reply.map)
                setPaint({
                    url: mapUrl.current,
                    width: reply.cols * (reply.step / scale),
                    height: reply.rows * (reply.step / scale),
                    offsets: new Map(pieces.map((p) => [p.at, [p.left, p.top]])),
                    letters: new Map(reply.colors),
                })
            }
            if (queued.current) {
                queued.current = false
                round()
            }
        }
        if (busy.current) queued.current = true
        else round()
    }, [container, version, scrolled, layout])

    // Text moves while scrolling: once it settles, paint it where it now is
    useEffect(() => {
        const root = container.current
        if (!root || !paint) return
        let timer: ReturnType<typeof setTimeout>
        const onScroll = () => {
            clearTimeout(timer)
            timer = setTimeout(() => setScrolled((n) => n + 1), 60)
        }
        root.addEventListener('scroll', onScroll)
        return () => {
            clearTimeout(timer)
            root.removeEventListener('scroll', onScroll)
        }
    }, [container, paint !== null]) // eslint-disable-line react-hooks/exhaustive-deps

    return paint
}
