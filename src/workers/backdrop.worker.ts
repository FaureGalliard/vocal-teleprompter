// Works out how what is behind the window looks and how to color the text
// over it, away from the thread that draws the interface, so neither the
// blur nor the per-letter colors can make it stutter.

import {
    blur,
    colorMap,
    cropBackdrop,
    rgb,
    samePicture,
    settle,
    type Backdrop,
} from '../lib/backdrop'
import { paintLetters, type Seen } from '../lib/letterPaint'
import type { WorkerReply, WorkerRequest } from './backdropMessages'

// Softening at 100%, in samples
const MAX_BLUR = 8
// Average difference per channel below which a look counts as the same as
// the last one (screen noise, a blinking caret elsewhere)
const SAME_BELOW = 1.5

// The last capture of the monitor the window is on
let monitor: Backdrop | null = null
// What the eye sees behind the text, from the last look
let seen: Seen | null = null
// The last look as it came, and how it was asked for, to spot repeats
let lastPixels: Uint8Array | null = null
let lastAsked = ''
// Each letter's last luminance and color, kept between rounds
let picked = new Map<number, number>()
// The last color map handed to the text, to keep it while it still holds
let shownMap: Uint8ClampedArray | null = null
const colors = new Map<number, string>()

const reply = (message: WorkerReply) =>
    (self as unknown as { postMessage(m: WorkerReply): void }).postMessage(message)

async function picture(image: Uint8ClampedArray, cols: number, rows: number) {
    const canvas = new OffscreenCanvas(cols, rows)
    canvas.getContext('2d')!.putImageData(new ImageData(image, cols, rows), 0, 0)
    return canvas.convertToBlob()
}

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
    if (data.type === 'reset') {
        seen = null
        monitor = null
        lastPixels = null
        shownMap = null
        picked = new Map()
        colors.clear()
        return
    }

    if (data.type === 'view') {
        const { id, capture, place, background, opacity, soften } = data
        if (capture) monitor = { ...capture, pixels: new Uint8Array(capture.pixels) }
        const crop = monitor && cropBackdrop(monitor, place)
        if (!monitor || !crop) return reply({ type: 'away', id })
        const { cols, rows, pixels } = crop
        const step = monitor.step
        const asked = `${cols}x${rows}:${background}:${opacity}:${soften}`
        if (asked === lastAsked && lastPixels?.length === pixels.length) {
            let change = 0
            for (let i = 0; i < pixels.length; i++) change += Math.abs(pixels[i] - lastPixels[i])
            // Same picture behind the window: redrawing it would only flicker
            if (change / pixels.length < SAME_BELOW) return reply({ type: 'same', id })
        }
        lastPixels = pixels
        lastAsked = asked
        const raw = Float32Array.from(pixels)
        const radius = Math.round((soften / 100) * MAX_BLUR)
        // Two lighter passes come close to a soft, round blur, without the
        // boxy look of one strong pass
        const half = Math.ceil(radius / 2)
        const behind = radius ? blur(blur(raw, cols, rows, half), cols, rows, half) : raw
        let glass: Blob | null = null
        if (radius) {
            const image = new Uint8ClampedArray(cols * rows * 4)
            for (let i = 0; i < cols * rows; i++) {
                image[i * 4] = behind[i * 3]
                image[i * 4 + 1] = behind[i * 3 + 1]
                image[i * 4 + 2] = behind[i * 3 + 2]
                image[i * 4 + 3] = 255
            }
            glass = await picture(image, cols, rows)
        }
        // The window's own background blended over it, eased in over time
        const fill = rgb(background)
        const now = new Float32Array(behind.length)
        for (let i = 0; i < behind.length; i++)
            now[i] = opacity * fill[i % 3] + (1 - opacity) * behind[i]
        const sameSize = seen?.cols === cols && seen.rows === rows
        seen = { cols, rows, step, rgb: settle(sameSize ? seen!.rgb : null, now) }
        reply({ type: 'view', id, glass, cols, rows, step })
        return
    }

    // paint: a readable color for every point, then for every letter
    const { id, letters, textColor, scale, showing } = data
    if (!seen)
        return reply({
            type: 'paint',
            id,
            map: null,
            kept: false,
            cols: 0,
            rows: 0,
            step: 1,
            colors: [],
        })
    const { cols, rows, step } = seen
    const image = colorMap(seen.rgb, cols, rows, textColor)
    picked = paintLetters(image, seen, letters, textColor, scale, picked, colors)
    // Looks the same as the map showing: keep that one, nothing to swap
    const kept = showing && samePicture(shownMap, image)
    if (!kept) shownMap = image
    reply({
        type: 'paint',
        id,
        map: kept ? null : await picture(image, cols, rows),
        kept,
        cols,
        rows,
        step,
        colors: [...colors],
    })
}
