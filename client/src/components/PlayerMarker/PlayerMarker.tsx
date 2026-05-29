import styles from './PlayerMarker.module.css';

// Character is drawn facing DOWN (weapon south); +180° points heading 0 north.
const SVG_RATIO = 96 / 161;
const HEADING_OFFSET = 180;
// The player's actual position within the SVG (body/head center), as fractions
// of the viewBox — NOT the geometric center, since the weapon fills the lower
// half. Used for both anchoring on mapPos and the rotation pivot, so the
// character spins in place at the body. Nudge ANCHOR_Y if it's slightly off.
const ANCHOR_X = 0.5;
const ANCHOR_Y = 0.21; // back of the head (top of the head circle)

export type MarkerStyle = 'character' | 'arrow';

interface PlayerMarkerProps {
	/** Facing in degrees (0 = north, clockwise). */
	heading?: number;
	/** Character height in px (width derives from the SVG aspect ratio). */
	size?: number;
	/** Show an expanding radar-ping ring emanating from the player. */
	ping?: boolean;
	/** 'character' = top-down sprite, 'arrow' = simple location arrow. */
	variant?: MarkerStyle;
}

/**
 * Player marker — top-down character, rotated to the facing heading.
 * The SVG is referenced as an <img> inside a sized HTML <div>: the div gives
 * concrete dimensions (the SVG declares width/height 100%, so it needs a sized
 * container) and owns the centering + rotation transform (reliable on HTML,
 * unlike % transforms on an <svg> element). Editing the .svg file flows through
 * automatically — no need to touch this component.
 */
export function PlayerMarker({ heading = 0, size = 38, ping = false, variant = 'character' }: PlayerMarkerProps) {
	if (variant === 'arrow') {
		// Simple location arrow, points up at heading 0 (no offset; drawn north-up),
		// centered on the player point.
		const d = size * 1.1;
		return (
			<>
				{ping && <span className={styles.ping} style={{ width: size, height: size }} />}
				<div
					className={styles.arrow}
					style={{ width: d, height: d, transform: `translate(-50%, -50%) rotate(${heading}deg)` }}
				>
					<svg viewBox="0 0 24 24" width="100%" height="100%" aria-label="Player">
						<path
							d="M12 2 L20.5 21 L12 16.5 L3.5 21 Z"
							fill="#F17370"
							stroke="#ffffff"
							strokeWidth={1.6}
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</>
		);
	}
	return (
		<>
			{ping && <span className={styles.ping} style={{ width: size, height: size }} />}
		<div
			className={styles.sprite}
			style={{
				width: size * SVG_RATIO,
				height: size,
				transform: `translate(-${ANCHOR_X * 100}%, -${ANCHOR_Y * 100}%) rotate(${heading + HEADING_OFFSET}deg)`,
				transformOrigin: `${ANCHOR_X * 100}% ${ANCHOR_Y * 100}%`,
			}}
		>
			<img
				src="/top-down-player.svg"
				alt="Player"
				draggable={false}
				style={{ width: '100%', height: '100%', display: 'block' }}
			/>
		</div>
		</>
	);
}
