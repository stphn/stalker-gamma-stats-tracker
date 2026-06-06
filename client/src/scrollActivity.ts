/**
 * Overlay-style scrollbars: reveal the scrollbar while a region is actively
 * scrolling, then fade it back out after a short idle. CSS alone can't express
 * "is scrolling", so we tag the scrolled element with `data-scrolling` and clear
 * it on a debounce; the styling lives in App.css.
 */

const IDLE_MS = 700;
const timers = new WeakMap<Element, number>();

function flag(el: Element) {
	el.setAttribute('data-scrolling', '');
	const prev = timers.get(el);
	if (prev !== undefined) clearTimeout(prev);
	timers.set(
		el,
		window.setTimeout(() => {
			el.removeAttribute('data-scrolling');
			timers.delete(el);
		}, IDLE_MS),
	);
}

function onScroll(e: Event) {
	// Window/document scrolls report `document` as the target; map those to <html>.
	const target = e.target;
	const el = target instanceof Element ? target : document.documentElement;
	flag(el);
}

/** Call once at startup. Capture phase so nested scroll containers are caught too. */
export function initScrollActivity() {
	document.addEventListener('scroll', onScroll, { capture: true, passive: true });
}
