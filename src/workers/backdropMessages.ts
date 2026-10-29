import type { Place } from '../lib/backdrop'
import type { Letter } from '../lib/letterPaint'

// What the interface asks the backdrop worker for
export type WorkerRequest =
    // Forget everything: the background turned solid
    | { type: 'reset' }
    // What is behind the window at `place`: from a new capture of its
    // monitor when there is one, else from the last one (the window moved)
    | {
          type: 'view'
          id: number
          capture: {
              cols: number
              rows: number
              step: number
              x: number
              y: number
              // RGB per sample, transferred
              pixels: ArrayBuffer
          } | null
          place: Place
          background: string
          opacity: number
          // How much to blur it, 0-100
          soften: number
          // The chosen text color, for the veil to make room for the text
          textColor: string
      }
    // The text's colors over the last look, for the letters now in view
    | { type: 'paint'; id: number; letters: Letter[]; textColor: string; scale: number }

// And what it answers
export type WorkerReply =
    // The frosted glass, veiled where the text needs it
    | { type: 'view'; id: number; glass: Blob | null; cols: number; rows: number; step: number }
    // Nothing changed since the last look: keep showing what is there
    | { type: 'same'; id: number }
    // The window is off the captured monitor (or there is no capture yet)
    | { type: 'away'; id: number }
    | {
          type: 'paint'
          id: number
          // The text color for every sample, null before the first look
          map: Blob | null
          cols: number
          rows: number
          step: number
          // Each letter's own color, by its offset in the script
          colors: [number, string][]
      }
