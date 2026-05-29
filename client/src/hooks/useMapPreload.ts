import { useEffect } from 'react';
import mapLevels from '../data/map-levels.json';
import { mapUrl } from '../utils/mapsBase';

interface Lvl { id: string; underground: boolean; rawRect?: unknown }

// Surface levels that actually have a map image (matches what MapView renders)
const surfaceIds: string[] = (mapLevels as { levels: Lvl[] }).levels
	.filter(l => !l.underground && l.rawRect)
	.map(l => l.id);

/**
 * Warm the browser cache for all map images in the background, so opening the
 * map / switching levels is instant. Runs on idle (never blocks first paint),
 * prioritises the global backdrop + the current level, then the rest, with a
 * small concurrency cap so it doesn't saturate the connection.
 */
export function useMapPreload(priorityId?: string) {
	useEffect(() => {
		const files = ['global-web.webp'];
		if (priorityId) files.push(`${priorityId}.webp`);
		for (const id of surfaceIds) {
			const f = `${id}.webp`;
			if (!files.includes(f)) files.push(f);
		}

		let cancelled = false;
		const imgs: HTMLImageElement[] = [];
		let idx = 0;
		const POOL = 4;

		const loadNext = () => {
			if (cancelled || idx >= files.length) return;
			const img = new Image();
			imgs.push(img);
			img.onload = img.onerror = () => { if (!cancelled) loadNext(); };
			img.src = mapUrl(files[idx++]);
		};

		const start = () => { for (let k = 0; k < POOL; k++) loadNext(); };

		const ric = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback : null;
		const handle = ric ? ric(start, { timeout: 3000 }) : window.setTimeout(start, 1200);

		return () => {
			cancelled = true;
			for (const im of imgs) { im.onload = im.onerror = null; im.src = ''; }
			if (ric) window.cancelIdleCallback?.(handle as number);
			else window.clearTimeout(handle as number);
		};
	}, [priorityId]);
}
