import { useEffect, useRef } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

interface McpRequest {
    id: number
    method: string
    params: Record<string, unknown>
}

export type McpHandlers = Record<string, (params: Record<string, unknown>) => unknown>

// Answers the requests AI assistants send through the connector (see
// src-tauri/src/mcp). A handler returns the result or throws a message the
// assistant gets to read.
export function useMcpBridge(handlers: McpHandlers) {
    const handlersRef = useRef(handlers)
    useEffect(() => {
        handlersRef.current = handlers
    })

    useEffect(() => {
        const respond = (id: number, result: unknown, error?: string) =>
            invoke('mcp_respond', { id, result: result ?? null, error: error ?? null }).catch(
                (e) => console.error('Could not answer the AI connector:', e),
            )

        const unlisten = listen<McpRequest>('mcp-request', async ({ payload }) => {
            const handler = handlersRef.current[payload.method]
            if (!handler) {
                respond(payload.id, null, `Unknown tool: ${payload.method}`)
                return
            }
            try {
                respond(payload.id, await handler(payload.params ?? {}))
            } catch (e) {
                respond(payload.id, null, e instanceof Error ? e.message : String(e))
            }
        })
        unlisten.then(() => invoke('mcp_ready')).catch((e) => console.error(e))
        return () => {
            unlisten.then((off) => off())
        }
    }, [])
}
