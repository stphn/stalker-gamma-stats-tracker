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

		// Realtime: prepend new rows as they arrive
		const channel = supabase
			.channel('runs-live')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'runs' },
				(payload) => {
					const incoming = payload.new as Run
					setRuns((prev) => {
						// Deduplicate by start in case of rapid duplicate events
						const exists = prev.some((r) => r.start === incoming.start)
						if (exists) return prev
						return [incoming, ...prev].slice(0, 10)
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
