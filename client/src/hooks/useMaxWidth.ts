import { useEffect, useRef, useState } from 'react';

/** Mirrors a `@container (max-width: max)` query in JS, for layout decisions CSS
 *  can't make on its own (e.g. relocating a DOM node between containers). Observes
 *  the ref'd element's content-box inline size so it matches the CSS breakpoints. */
export function useMaxWidth(max: number) {
	const ref = useRef<HTMLElement>(null);
	// Seed from the viewport (≈ the full-width layout container) to avoid a flash
	// of the wide layout before the observer measures on already-narrow loads.
	const [matches, setMatches] = useState(
		() => typeof window !== 'undefined' && window.innerWidth <= max,
	);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) =>
			setMatches(entry.contentRect.width <= max),
		);
		ro.observe(el);
		return () => ro.disconnect();
	}, [max]);

	return [ref, matches] as const;
}
