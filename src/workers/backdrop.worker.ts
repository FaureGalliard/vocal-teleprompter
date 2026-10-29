// Works out how what is behind the window looks and how to color the text
// over it, away from the thread that draws the interface, so neither the
// blur nor the per-letter colors can make it stutter.

import { blur, colorMap, rgb, settle } from '../lib/backdrop'
import { paintLetters, type Seen } from '../lib/letterPaint'
import type { WorkerReply, WorkerRequest } from './backdropMessages'

// Softening at 100%, in samples
const MAX_BLUR = 8

// What the eye sees behind the text, from the last look
let seen: Seen | null = null
// Each letter's last luminance and color, kept between rounds
let picked = new Map<number, number>()
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
        picked = new Map()
        colors.clear()
        return
    }

    if (data.type === 'view') {
        const { id, cols, rows, step, background, opacity, soften } = data
        const raw = Float32Array.from(new Uint8Array(data.pixels))
        const radius = Math.round((soften / 100) * MAX_BLUR)
        const behind = radius ? blur(raw, cols, rows, radius) : raw
        let glass: Blob | null = null
        if (radius) {
            const image = new Uint8ClampedArray(cols * rows * 4)
            for (let i = 0; i < cols * rows; i++)
                image.set([behind[i * 3], behind[i * 3 + 1], behind[i * 3 + 2], 255], i * 4)
            glass = await picture(image, cols, rows)
        }
        // The window's own background blended over it, eased in over time
        const fill = rgb(background)
        const now = behind.map((v, i) => opacity * fill[i % 3] + (1 - opacity) * v)
        const sameSize = seen?.cols === cols && seen.rows === rows
        seen = { cols, rows, step, rgb: settle(sameSize ? seen!.rgb : null, now) }
        reply({ type: 'view', id, glass, cols, rows, step })
        return
    }

    // paint: a readable color for every point, then for every letter
    const { id, letters, textColor, scale } = data
    if (!seen) return reply({ type: 'paint', id, map: null, cols: 0, rows: 0, step: 1, colors: [] })
    const { cols, rows, step } = seen
    const image = colorMap(seen.rgb, cols, rows, textColor)
    picked = paintLetters(image, seen, letters, textColor, scale, picked, colors)
    reply({
        type: 'paint',
        id,
        map: await picture(image, cols, rows),
        cols,
        rows,
        step,
        colors: [...colors],
    })
}
