import type { ActorInfo } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import mapLevels from '../../data/map-levels.json';
import { mapUrl } from '../../utils/mapsBase';
import { PlayerMarker, type MarkerStyle } from '../PlayerMarker/PlayerMarker';
import styles from './Minimap.module.css';

interface WorldBounds { minX: number; maxX: number; minZ: number; maxZ: number }
interface LevelEntry  { id: string; name: string; underground: boolean; worldBounds?: WorldBounds }

const levels: LevelEntry[] = (mapLevels as { levels: LevelEntry[] }).levels;
const levelIndex = new Map(levels.map(l => [l.id, l]));

const VIEW = 180;          // minimap viewport size (px)
const COMPASS_ZOOM = 3;    // how zoomed-in compass mode is (long side = VIEW × this)

function worldToUV(px: number, pz: number, b: WorldBounds) {
	const u = (px - b.minX) / (b.maxX - b.minX);
	const v = 1 - (pz - b.minZ) / (b.maxZ - b.minZ); // Z inverted: north = top
	return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}

interface MinimapProps {
	actor: ActorInfo | null;
	onExpand: () => void;
	markerStyle: MarkerStyle;
}

/** Compass-style minimap: zoomed in, map rotates to the player's facing (always
 *  up), player fixed at center. Click anywhere to open the full map. */
export function Minimap({ actor, onExpand, markerStyle }: MinimapProps) {
	const { t } = useI18n();
	const levelId       = actor?.location ?? '';
	const levelData     = levelIndex.get(levelId) ?? null;
	const isUnderground = levelData?.underground ?? false;
	const hasPosition   = actor?.pos_x != null && actor?.pos_z != null;
	const wb            = levelData?.worldBounds;

	const uv      = hasPosition && wb ? worldToUV(actor!.pos_x!, actor!.pos_z!, wb) : null;
	const imgSrc  = isUnderground || !levelId ? null : mapUrl(`${levelId}.webp`);
	const heading = actor?.heading ?? 0;

	if (!levelId) return null;

	const compassActive = imgSrc && uv && wb;

	let body;
	if (!imgSrc) {
		body = <div className={styles.underground}><span>{t('minimap.underground')}</span></div>;
	} else if (compassActive) {
		const aspect = (wb!.maxX - wb!.minX) / (wb!.maxZ - wb!.minZ); // w/h
		const dW = aspect >= 1 ? VIEW * COMPASS_ZOOM : VIEW * COMPASS_ZOOM * aspect;
		const dH = aspect >= 1 ? (VIEW * COMPASS_ZOOM) / aspect : VIEW * COMPASS_ZOOM;
		const c  = VIEW / 2;
		body = (
			<>
				<div className={styles.rotor} style={{ transform: `rotate(${-heading}deg)` }}>
					<div
						className={styles.compassImg}
						style={{
							backgroundImage: `url(${imgSrc})`,
							width: dW,
							height: dH,
							left: c - uv!.u * dW,
							top: c - uv!.v * dH,
						}}
					/>
				</div>
				<div className={styles.compassPlayer}>
					<PlayerMarker heading={0} size={15} variant={markerStyle} />
				</div>
			</>
		);
	} else {
		// Have a map but no position yet — static north-up, no player
		body = <div className={styles.mapImg} style={{ backgroundImage: `url(${imgSrc})` }} />;
	}

	return (
		<button
			className={styles.root}
			onClick={onExpand}
			title={t('minimap.openFull')}
			aria-label={t('minimap.openFull')}
		>
			<div className={styles.mapWrap}>{body}</div>
			<div className={styles.hud} aria-hidden="true" />
		</button>
	);
}
