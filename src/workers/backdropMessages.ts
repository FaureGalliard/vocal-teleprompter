import type { Letter } from '../lib/letterPaint'

// What the interface asks the backdrop worker for
export type WorkerRequest =
    // Forget everything: the background turned solid
    | { type: 'reset' }
    // A new look at what is behind the window
    | {
          type: 'view'
          id: number
          cols: number
          rows: number
          step: number
          // RGB per sample, transferred
          pixels: ArrayBuffer
          background: string
          opacity: number
          // How much to blur it, 0-100
          soften: number
      }
    // The text's colors over the last look, for the letters now in view
    | { type: 'paint'; id: number; letters: Letter[]; textColor: string; scale: number }

// And what it answers
export type WorkerReply =
    // The frosted glass, null when not softening
    | { type: 'view'; id: number; glass: Blob | null; cols: number; rows: number; step: number }
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
