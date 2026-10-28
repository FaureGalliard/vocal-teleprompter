import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Check, Copy, Sparkles } from 'lucide-react'
import { useT } from '../i18n'
import Switch from './Switch'

const CLIENTS = [
    { id: 'claude', name: 'Claude Desktop' },
    { id: 'cursor', name: 'Cursor' },
    { id: 'vscode', name: 'VS Code' },
] as const

type ClientId = (typeof CLIENTS)[number]['id']

interface AiConnectorSectionProps {
    enabled: boolean
    onToggleEnabled: () => void
}

// Connects the MCP server (src-tauri/src/mcp) to AI assistants in one click
export default function AiConnectorSection({ enabled, onToggleEnabled }: AiConnectorSectionProps) {
    const t = useT()
    const [connected, setConnected] = useState<Partial<Record<ClientId, boolean>>>({})
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        for (const client of CLIENTS) {
            invoke<boolean>('is_mcp_client_connected', { client: client.id })
                .then((ok) => setConnected((c) => ({ ...c, [client.id]: ok })))
                .catch(() => {})
        }
    }, [])

    const connect = async (client: (typeof CLIENTS)[number]) => {
        try {
            await invoke<string[]>('connect_mcp_client', { client: client.id })
            setConnected((c) => ({ ...c, [client.id]: true }))
            setMessage({ text: t.ai.restart(client.name), error: false })
        } catch (e) {
            setMessage({ text: String(e), error: true })
        }
    }

    const copySnippet = async () => {
        try {
            await navigator.clipboard.writeText(await invoke<string>('mcp_config_snippet'))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            setMessage({ text: String(e), error: true })
        }
    }

    return (
        <div className="border-t border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1">
                <Sparkles
                    size={12}
                    className="text-white/40"
                />
                <span className="flex-1 text-[10px] font-medium uppercase tracking-wide text-white/40">
                    {t.ai.title}
                </span>
                <Switch
                    on={enabled}
                    onToggle={onToggleEnabled}
                />
            </div>
            <div className="text-[10px] text-white/40 leading-snug mb-2">{t.ai.hint}</div>

            <div className={enabled ? 'flex flex-col gap-1' : 'flex flex-col gap-1 opacity-40 pointer-events-none'}>
                {CLIENTS.map((client) => (
                    <div
                        key={client.id}
                        className="flex items-center justify-between text-[11px]">
                        <span className="text-white/70">{client.name}</span>
                        {connected[client.id] ? (
                            <span className="flex items-center gap-1 text-[10px] text-[#4ade80]">
                                <Check size={11} />
                                {t.ai.connected}
                            </span>
                        ) : (
                            <button
                                onClick={() => connect(client)}
                                className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#445ade] hover:bg-[#3448c5] text-white transition-colors">
                                {t.ai.connect}
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={copySnippet}
                    className="flex items-center gap-1.5 mt-1 text-[10px] text-white/40 hover:text-white transition-colors">
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? t.ai.copied : t.ai.copy}
                </button>

                {message && (
                    <div
                        className={`text-[10px] leading-snug mt-1 ${
                            message.error ? 'text-red-400' : 'text-white/50'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    )
}
