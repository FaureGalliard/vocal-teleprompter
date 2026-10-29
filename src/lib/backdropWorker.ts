import type { WorkerReply, WorkerRequest } from '../workers/backdropMessages'

// A view request is answered with a new view, or `same` when nothing changed
type Answer<T extends 'view' | 'paint'> = Extract<
    WorkerReply,
    { type: T extends 'view' ? 'view' | 'same' : T }
>
type Ask<T extends 'view' | 'paint'> = Omit<Extract<WorkerRequest, { type: T }>, 'id' | 'type'>

let worker: Worker | null = null
let nextId = 0
const waiting = new Map<number, (reply: WorkerReply) => void>()

// The one worker, started on first use
function start() {
    if (worker) return worker
    worker = new Worker(new URL('../workers/backdrop.worker.ts', import.meta.url), {
        type: 'module',
    })
    worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
        waiting.get(data.id)?.(data)
        waiting.delete(data.id)
    }
    return worker
}

function ask<T extends 'view' | 'paint'>(
    type: T,
    request: Ask<T>,
    transfer: Transferable[] = [],
): Promise<Answer<T>> {
    const id = nextId++
    return new Promise((resolve) => {
        waiting.set(id, (reply) => resolve(reply as Answer<T>))
        start().postMessage({ ...request, type, id }, transfer)
    })
}

// The interface's side of the backdrop worker
export const backdropWorker = {
    view: (request: Ask<'view'>) => ask('view', request, [request.pixels]),
    paint: (request: Ask<'paint'>) => ask('paint', request),
    reset: () => worker?.postMessage({ type: 'reset' } satisfies WorkerRequest),
}
