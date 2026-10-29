import { useEffect, useRef, useState, type RefObject } from 'react'
import { colorMap, complement } from '../lib/backdrop'
import { atLuminance, luminance, pickLuminance } from '../lib/letterColor'
import type { Seen } from './useBackdropView'

// A picture of the text color for every point of the window, and where each
// piece of text sits on it (by its `data-at` offset), so the text can be
// painted from it
export interface BackdropPaint {
    url: string
    width: number
    height: number
    offsets: Map<number, [number, number]>
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

interface Letter {
    key: number
    left: number
    top: number
    right: number
    bottom: number
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

// Paints each letter's box on the color map with its own color: the
// luminance that stands out most from what is in and around the box (judged
// on its worst spots), in the hue opposite to what is there
function paintLetters(
    image: Uint8ClampedArray,
    seen: Seen,
    found: Letter[],
    textColor: string,
    previous: Map<number, number>,
) {
    const { cols, rows, step, rgb } = seen
    const cell = (v: number) => (v * window.devicePixelRatio) / step
    const picked = new Map<number, number>()
    for (const letter of found) {
        const [c0, c1] = [Math.floor(cell(letter.left)), Math.ceil(cell(letter.right))]
        const [r0, r1] = [Math.floor(cell(letter.top)), Math.ceil(cell(letter.bottom))]
        const around: number[] = []
        const sum = [0, 0, 0]
        for (let r = Math.max(0, r0 - 1); r < Math.min(rows, r1 + 1); r++)
            for (let c = Math.max(0, c0 - 1); c < Math.min(cols, c1 + 1); c++) {
                const i = (r * cols + c) * 3
                around.push(luminance(rgb[i], rgb[i + 1], rgb[i + 2]))
                for (let k = 0; k < 3; k++) sum[k] += rgb[i + k]
            }
        if (!around.length) continue
        const y = pickLuminance(around, previous.get(letter.key))
        picked.set(letter.key, y)
        const [r, g, b] = sum.map((v) => v / around.length)
        const color = atLuminance(complement(r, g, b) ?? textColor, y)
        const n = parseInt(color.slice(1), 16)
        const pixel = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
        for (let rr = Math.max(0, r0); rr < Math.min(rows, r1); rr++)
            for (let cc = Math.max(0, c0); cc < Math.min(cols, c1); cc++)
                image.set(pixel, (rr * cols + cc) * 4)
    }
    return picked
}

// Turns each new look at the backdrop into a color map for the text in
// `container`: a readable color for every point, then for every letter
export function useBackdropPaint(
    container: RefObject<HTMLElement | null>,
    seen: Seen | null,
    // Used over gray areas, which have no hue to work from
    textColor: string,
): BackdropPaint | null {
    const [paint, setPaint] = useState<BackdropPaint | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    // Each letter's last luminance, so it only changes for a clear gain
    const pickedRef = useRef(new Map<number, number>())
    // Bumped after scrolling, to paint the letters where they now are
    const [scrolled, setScrolled] = useState(0)

    useEffect(() => {
        const root = container.current
        if (!seen || !root) {
            pickedRef.current.clear()
            setPaint(null)
            return
        }
        const { cols, rows, step } = seen
        const scale = window.devicePixelRatio
        const pieces = measure(root)

        const canvas = (canvasRef.current ??= document.createElement('canvas'))
        canvas.width = cols
        canvas.height = rows
        // Point by point first, then each letter on top with its own color
        const image = colorMap(seen.rgb, cols, rows, textColor)
        pickedRef.current = paintLetters(image, seen, letters(root), textColor, pickedRef.current)
        canvas.getContext('2d')!.putImageData(new ImageData(image, cols, rows), 0, 0)
        setPaint({
            url: canvas.toDataURL(),
            width: cols * (step / scale),
            height: rows * (step / scale),
            offsets: new Map(pieces.map((p) => [p.at, [p.left, p.top]])),
        })
        // A new capture is what triggers a new look
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seen, scrolled])

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
