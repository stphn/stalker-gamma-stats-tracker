import { useRef } from 'react';
import type { ActorInfo } from '../../types';
import { NavigationArrowIcon } from '@phosphor-icons/react';
import { useI18n } from '../../i18n/I18nContext';
import mapLevels from '../../data/map-levels.json';
import { mapUrl } from '../../utils/mapsBase';
import { FACTION_COLORS } from '../../utils/constants';
import styles from './Minimap.module.css';

interface WorldBounds { minX: number; maxX: number; minZ: number; maxZ: number }
interface RawRect     { x1: number; y1: number; x2: number; y2: number }
interface LevelEntry  { id: string; name: string; underground: boolean; worldBounds?: WorldBounds; rawRect?: RawRect }

const levels: LevelEntry[] = (mapLevels as { levels: LevelEntry[] }).levels;
const levelIndex = new Map(levels.map(l => [l.id, l]));

const VIEW = 166;
const COMPASS_ZOOM = 3;

// Global stitched-map dimensions (matches MapView) — used to align the low-res
// global backdrop that fills the circle when the player is near a level edge.
const WORLD_W = 1024;
const WORLD_H = 2634;

function worldToUV(px: number, pz: number, b: WorldBounds) {
	const u = (px - b.minX) / (b.maxX - b.minX);
	const v = 1 - (pz - b.minZ) / (b.maxZ - b.minZ);
	return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}

interface MinimapProps {
	actor: ActorInfo | null;
	onExpand: () => void;
}

export function Minimap({ actor, onExpand }: MinimapProps) {
	const { t } = useI18n();
	const rotRef = useRef({ last: 0, acc: 0 });
	const levelId       = actor?.location ?? '';
	const levelData     = levelIndex.get(levelId) ?? null;
	const isUnderground = levelData?.underground ?? false;
	const hasPosition   = actor?.pos_x != null && actor?.pos_z != null;
	const wb            = levelData?.worldBounds;

	const uv      = hasPosition && wb ? worldToUV(actor!.pos_x!, actor!.pos_z!, wb) : null;
	const imgSrc  = isUnderground || !levelId ? null : mapUrl(`${levelId}.webp`);
	const heading = actor?.heading ?? 0;
	const color   = FACTION_COLORS[actor?.faction ?? ''] ?? '#e8c46a';

	// Unwrap heading into a continuous angle so the CSS transition always takes
	// the shortest path. Otherwise a small turn across the 0/360 seam (e.g.
	// 358°→2°) animates ~356° the long way → the map spins. Keyed on heading
	// equality so it stays idempotent under StrictMode's double render.
	if (heading !== rotRef.current.last) {
		const delta = ((heading - rotRef.current.last + 540) % 360) - 180;
		rotRef.current.acc += delta;
		rotRef.current.last = heading;
	}
	const rotation = rotRef.current.acc;

	if (!levelId) return null;

	const compassActive = imgSrc && uv && wb;

	let mapContent: React.ReactNode;
	if (!imgSrc) {
		mapContent = <div className={styles.underground}><span>{t('minimap.underground')}</span></div>;
	} else if (compassActive) {
		const aspect = (wb!.maxX - wb!.minX) / (wb!.maxZ - wb!.minZ);
		const dW = aspect >= 1 ? VIEW * COMPASS_ZOOM : VIEW * COMPASS_ZOOM * aspect;
		const dH = aspect >= 1 ? (VIEW * COMPASS_ZOOM) / aspect : VIEW * COMPASS_ZOOM;
		const c  = VIEW / 2;

		// Global backdrop: the stitched map scaled so this level's rawRect region
		// matches the high-res level image exactly, then panned to the same world
		// point. At a level edge the neighbouring terrain shows through instead of
		// flat fill. Single cached image, GPU-composited transform — no per-frame work.
		const rr = levelData!.rawRect;
		let backdrop: React.ReactNode = null;
		if (rr) {
			const rw = rr.x2 - rr.x1;
			const rh = rr.y2 - rr.y1;
			const gW = (dW * WORLD_W) / rw;
			const gH = (dH * WORLD_H) / rh;
			backdrop = (
				<div
					className={styles.compassImg}
					style={{
						backgroundImage: `url(${mapUrl('global-web.webp')})`,
						width: gW,
						height: gH,
						transform: `translate3d(${c - dW * (uv!.u + rr.x1 / rw)}px, ${c - dH * (uv!.v + rr.y1 / rh)}px, 0)`,
					}}
				/>
			);
		}

		mapContent = (
			<>
				{backdrop}
				<div
					className={styles.compassImg}
					style={{
						backgroundImage: `url(${imgSrc})`,
						width: dW,
						height: dH,
						// Pan via transform (GPU-composited) instead of left/top so the
						// upscaled map doesn't repaint/flicker each frame while animating.
						transform: `translate3d(${c - uv!.u * dW}px, ${c - uv!.v * dH}px, 0)`,
					}}
				/>
			</>
		);
	} else {
		mapContent = <div className={styles.mapImg} style={{ backgroundImage: `url(${imgSrc})` }} />;
	}

	return (
		<button
			className={styles.root}
			onClick={onExpand}
			title={t('minimap.openFull')}
			aria-label={t('minimap.openFull')}
		>
			<div className={styles.mapWrap}>
				<div className={styles.rotor} style={{ transform: `rotate(${-rotation}deg)` }}>
					{/* mapClip first — its box-shadow spreads into ring area behind the ring img */}
					<div className={styles.mapClip}>{mapContent}</div>
					{/* compassRing renders on top of the shadow */}
					<img src="/compass.webp" className={styles.compassRing} alt="" draggable={false} />
				</div>
				{compassActive && (
					<div className={styles.compassPlayer}>
						<div style={{
							position: 'absolute',
							width: 14,
							height: 14,
							left: 0,
							top: 0,
							transform: 'translate(-50%, -50%) rotate(45deg)',
							filter: `drop-shadow(0 0 3px rgba(0,0,0,1)) drop-shadow(0 0 2px ${color})`,
						}}>
							<NavigationArrowIcon width="100%" height="100%" weight="fill" color={color} />
						</div>
					</div>
				)}
			</div>
		</button>
	);
}
