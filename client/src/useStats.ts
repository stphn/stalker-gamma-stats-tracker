import { useEffect, useRef, useState } from 'react'
import type { StatsData } from './types'

const isLocal   = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const WS_URL    = import.meta.env.VITE_WS_URL ?? `${isLocal ? 'ws' : 'wss'}://${window.location.hostname}:3001`
const CACHE_KEY = 'tracker_last_stats'

function loadCache(): StatsData | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveCache(data: StatsData) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export function useStats() {
    const [data, setData]           = useState<StatsData | null>(loadCache)
    const [connected, setConnected] = useState(false)
    const [stale, setStale]         = useState(true)
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        function connect() {
            const ws = new WebSocket(WS_URL)
            wsRef.current = ws

            ws.onopen    = () => setConnected(true)
            ws.onclose   = () => { setConnected(false); setStale(true); setTimeout(connect, 3000) }
            ws.onerror   = () => ws.close()
            ws.onmessage = e => {
                try {
                    const parsed = JSON.parse(e.data) as StatsData
                    setData(parsed)
                    setStale(false)
                    saveCache(parsed)
                } catch {}
            }
        }
        connect()
        return () => wsRef.current?.close()
    }, [])

    return { data, connected, stale }
}
