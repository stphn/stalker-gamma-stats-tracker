import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Run } from './types'

export function useRuns(): { runs: Run[]; loading: boolean } {
	const [runs, setRuns] = useState<Run[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Initial fetch — most recent 10 runs, newest first
		supabase
			.from('runs')
			.select('*')
			.order('start', { ascending: false })
			.limit(10)
			.then(({ data }) => {
				if (data) setRuns(data as Run[])
				setLoading(false)
			})

		// Realtime: merge rows as they arrive. The server upserts on `start`, so a
		// run is INSERTed when it begins and later UPDATEd once it ends (death
		// location/pos filled in) — listen for both so deaths appear without a reload.
		const channel = supabase
			.channel('runs-live')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'runs' },
				(payload) => {
					if (payload.eventType === 'DELETE') return
					const incoming = payload.new as Run
					setRuns((prev) => {
						// Upsert by `start`: replace the matching row (UPDATE) or prepend (INSERT)
						const idx = prev.findIndex((r) => r.start === incoming.start)
						if (idx !== -1) {
							const next = prev.slice()
							next[idx] = { ...next[idx], ...incoming }
							return next
						}
						return [incoming, ...prev]
							.sort((a, b) => b.start - a.start)
							.slice(0, 10)
					})
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [])

	return { runs, loading }
}
