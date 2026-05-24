import { useEffect, useRef, useState } from 'react'
import type { StatsData } from './types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001'

export function useStats() {
    const [data, setData]       = useState<StatsData | null>(null)
    const [connected, setConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        function connect() {
            const ws = new WebSocket(WS_URL)
            wsRef.current = ws

            ws.onopen    = () => setConnected(true)
            ws.onclose   = () => { setConnected(false); setTimeout(connect, 3000) }
            ws.onerror   = () => ws.close()
            ws.onmessage = e => {
                try { setData(JSON.parse(e.data)) } catch {}
            }
        }
        connect()
        return () => wsRef.current?.close()
    }, [])

    return { data, connected }
}
