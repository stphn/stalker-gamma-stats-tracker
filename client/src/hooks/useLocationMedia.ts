import { useEffect, useState } from 'react';

export interface LocationMedia {
	src: string;
	type: 'video' | 'image';
}

// Locations that have at least one .mp4 file in /public/locations/<id>/.
// Add an entry here whenever you drop a new video asset.
const VIDEO_LOCATIONS: Record<string, number[]> = {
	l06_rostok: [3],
};

function probeImage(src: string): Promise<string | null> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(src);
		img.onerror = () => resolve(null);
		img.src = src;
	});
}

export function useLocationMedia(
	location: string | undefined,
): LocationMedia | null {
	const [media, setMedia] = useState<LocationMedia | null>(null);

	useEffect(() => {
		if (!location) {
			setMedia(null);
			return;
		}
		setMedia(null);

		const loc = location; // capture for use inside async fn (TS narrowing)
		let cancelled = false;

		async function probe() {
			// If this location has known video slots, pick one at random — no probing needed.
			const videoSlots = VIDEO_LOCATIONS[loc];
			if (videoSlots && videoSlots.length > 0) {
				const slot = videoSlots[Math.floor(Math.random() * videoSlots.length)];
				const pad = String(slot).padStart(2, '0');
				if (!cancelled) {
					setMedia({
						src: `/locations/${loc}/${loc}_${pad}.mp4`,
						type: 'video',
					});
				}
				return;
			}

			// Otherwise probe for images (slots 1–3).
			const found: string[] = [];
			await Promise.all(
				[1, 2, 3].map(async (i) => {
					const src = `/locations/${loc}/${loc}_${String(i).padStart(2, '0')}.png`;
					const result = await probeImage(src);
					if (result) found[i - 1] = result;
				}),
			);

			if (cancelled) return;

			const images = found.filter(Boolean);
			if (images.length > 0) {
				setMedia({
					src: images[Math.floor(Math.random() * images.length)],
					type: 'image',
				});
			}
		}

		probe();
		return () => {
			cancelled = true;
		};
	}, [location]);

	return media;
}
