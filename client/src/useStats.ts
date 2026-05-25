import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { StatsData } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CACHE_KEY = 'tracker_last_stats'

function loadCache(): StatsData | null {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') }
    catch { return null }
}
function saveCache(data: StatsData) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export function useStats() {
    const [data, setData]           = useState<StatsData | null>(loadCache)
    const [connected, setConnected] = useState(false)
    const [stale, setStale]         = useState(true)

    useEffect(() => {
        // Initial fetch
        supabase
            .from('stats')
            .select('data')
            .eq('id', 'live')
            .single()
            .then(({ data: row }) => {
                if (row?.data) {
                    setData(row.data as StatsData)
                    saveCache(row.data as StatsData)
                    setStale(false)
                }
            })

        // Realtime subscription
        const channel = supabase
            .channel('stats-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stats', filter: 'id=eq.live' },
                payload => {
                    const incoming = (payload.new as { data: StatsData }).data
                    if (incoming) {
                        setData(incoming)
                        saveCache(incoming)
                        setStale(false)
                        setConnected(true)
                    }
                }
            )
            .subscribe(status => {
                setConnected(status === 'SUBSCRIBED')
            })

        return () => { supabase.removeChannel(channel) }
    }, [])

    return { data, connected, stale }
}
