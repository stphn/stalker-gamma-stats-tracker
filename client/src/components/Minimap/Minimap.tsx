import type { ActorInfo } from '../../types';
import { NavigationArrow } from '@phosphor-icons/react';
import { useI18n } from '../../i18n/I18nContext';
import mapLevels from '../../data/map-levels.json';
import { mapUrl } from '../../utils/mapsBase';
import { FACTION_COLORS } from '../../utils/constants';
import styles from './Minimap.module.css';

interface WorldBounds { minX: number; maxX: number; minZ: number; maxZ: number }
interface LevelEntry  { id: string; name: string; underground: boolean; worldBounds?: WorldBounds }

const levels: LevelEntry[] = (mapLevels as { levels: LevelEntry[] }).levels;
const levelIndex = new Map(levels.map(l => [l.id, l]));

const VIEW = 180;
const COMPASS_ZOOM = 3;

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
		const aspect = (wb!.maxX - wb!.minX) / (wb!.maxZ - wb!.minZ);
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
					<div style={{
						position: 'absolute',
						width: 15,
						height: 15,
						left: 0,
						top: 0,
						transform: 'translate(-50%, -50%)',
						filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))',
					}}>
						<NavigationArrow width="100%" height="100%" weight="fill" color={FACTION_COLORS[actor?.faction ?? ''] ?? '#e8c46a'} />
					</div>
				</div>
			</>
		);
	} else {
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
