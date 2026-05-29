import type { ActorInfo } from '../../types';
import mapLevels from '../../data/map-levels.json';
import { mapUrl } from '../../utils/mapsBase';
import styles from './Minimap.module.css';

interface WorldBounds { minX: number; maxX: number; minZ: number; maxZ: number }
interface LevelEntry  { id: string; name: string; underground: boolean; worldBounds?: WorldBounds }

const levels: LevelEntry[] = (mapLevels as { levels: LevelEntry[] }).levels;
const levelIndex = new Map(levels.map(l => [l.id, l]));

function worldToUV(px: number, pz: number, b: WorldBounds) {
	const u = (px - b.minX) / (b.maxX - b.minX);
	const v = 1 - (pz - b.minZ) / (b.maxZ - b.minZ); // Z inverted: north = top
	return { u: Math.max(0, Math.min(1, u)), v: Math.max(0, Math.min(1, v)) };
}

interface MinimapProps {
	actor: ActorInfo | null;
	onExpand: () => void;
}

export function Minimap({ actor, onExpand }: MinimapProps) {
	const levelId       = actor?.location ?? '';
	const levelData     = levelIndex.get(levelId) ?? null;
	const isUnderground = levelData?.underground ?? false;
	const hasPosition   = actor?.pos_x != null && actor?.pos_z != null;

	const uv     = hasPosition && levelData?.worldBounds
		? worldToUV(actor!.pos_x!, actor!.pos_z!, levelData.worldBounds)
		: null;
	const imgSrc = isUnderground || !levelId ? null : mapUrl(`${levelId}.webp`);

	if (!levelId) return null;

	return (
		<div className={styles.root} role="region" aria-label="Minimap">
			<div className={styles.header}>
				<span className={styles.zoneName}>{levelData?.name ?? levelId}</span>
				<button
					className={styles.expandBtn}
					onClick={onExpand}
					title="Open full map"
					aria-label="Open full map"
				>
					⊞
				</button>
			</div>
			<div className={styles.mapWrap}>
				{imgSrc ? (
					<div className={styles.mapImg} style={{ backgroundImage: `url(${imgSrc})` }}>
						{uv && (
							<div
								className={styles.dot}
								style={{ left: `${uv.u * 100}%`, top: `${uv.v * 100}%` }}
								aria-label="Player position"
							/>
						)}
					</div>
				) : (
					<div className={styles.underground}><span>UNDERGROUND</span></div>
				)}
			</div>
			<div className={styles.hud} aria-hidden="true" />
		</div>
	);
}
