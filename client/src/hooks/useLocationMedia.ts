import { useEffect, useState } from 'react';

export interface LocationMedia {
	src: string;
	type: 'video' | 'image';
}

function probeVideo(src: string): Promise<string | null> {
	return new Promise((resolve) => {
		const v = document.createElement('video');
		v.preload = 'metadata';
		v.onloadedmetadata = () => resolve(src);
		v.onerror = () => resolve(null);
		v.src = src;
	});
}

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

		let cancelled = false;

		async function probe() {
			const slots = [1, 2, 3];
			const videos: string[] = [];
			const images: string[] = [];

			await Promise.all(
				slots.map(async (i) => {
					const pad = String(i).padStart(2, '0');
					const base = `/locations/${location}/${location}_${pad}`;

					// Check video first, then image
					const vid = await probeVideo(`${base}.mp4`);
					if (vid) {
						videos[i - 1] = vid;
					} else {
						const img = await probeImage(`${base}.png`);
						if (img) images[i - 1] = img;
					}
				}),
			);

			if (cancelled) return;

			const foundVideos = videos.filter(Boolean);
			const foundImages = images.filter(Boolean);

			if (foundVideos.length > 0) {
				// Pick a random video
				setMedia({
					src: foundVideos[Math.floor(Math.random() * foundVideos.length)],
					type: 'video',
				});
			} else if (foundImages.length > 0) {
				setMedia({
					src: foundImages[Math.floor(Math.random() * foundImages.length)],
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
