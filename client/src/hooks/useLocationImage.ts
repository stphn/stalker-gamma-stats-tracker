import { useEffect, useState } from 'react';

// Stage backdrops live in /public/locations/<level>/ as positional files
// 00.webp, 01.webp, 02.webp … — the level name is NOT encoded in the filename.
// Optional day/ and night/ subfolders override by in-game time; when a variant
// folder is empty we fall back to the flat <level>/ folder.
const MAX_IMAGES = 16; // upper bound probed per folder (00 … 15)
const ROTATE_MS = 60_000; // swap the backdrop once a minute

// Probe 00.webp … (MAX-1).webp in a folder; resolve the ones that exist,
// kept in numeric order (Promise.all preserves input order).
function probeFolder(base: string): Promise<string[]> {
	return Promise.all(
		Array.from({ length: MAX_IMAGES }, (_, i) => {
			const url = `${base}/${String(i).padStart(2, '0')}.webp`;
			return new Promise<string | null>((resolve) => {
				const img = new Image();
				img.onload = () => resolve(url);
				img.onerror = () => resolve(null);
				img.src = url;
			});
		}),
	).then((results) => results.filter((u): u is string => u !== null));
}

export function useLocationImage(
	location: string | undefined,
	night = false,
): string | null {
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		if (!location) {
			setSrc(null);
			return;
		}

		let cancelled = false;
		let timer: ReturnType<typeof setInterval> | null = null;
		const base = `/locations/${location}`;
		const tod = night ? 'night' : 'day';

		(async () => {
			// Prefer the time-of-day variant; fall back to the flat folder.
			let images = await probeFolder(`${base}/${tod}`);
			if (!cancelled && images.length === 0) images = await probeFolder(base);
			if (cancelled) return;

			// Guard rail: empty folder → no stage image (keeps the GL canvas blank).
			if (images.length === 0) {
				setSrc(null);
				return;
			}

			let i = 0;
			setSrc(images[0]);
			// Only rotate when there's more than one to cycle through.
			if (images.length > 1) {
				timer = setInterval(() => {
					i = (i + 1) % images.length;
					setSrc(images[i]);
				}, ROTATE_MS);
			}
		})();

		return () => {
			cancelled = true;
			if (timer) clearInterval(timer);
		};
	}, [location, night]);

	return src;
}
