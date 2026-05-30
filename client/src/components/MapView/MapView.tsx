import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavigationArrow, Skull, SmileyXEyes, UserCircleDashed } from '@phosphor-icons/react';
import type { ActorInfo, Companion, Run } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import mapLevelsData from '../../data/map-levels.json';
import { mapUrl } from '../../utils/mapsBase';
import { hp_color } from '../../utils/formatters';
import { FACTION_COLORS } from '../../utils/constants';
import styles from './MapView.module.css';

// World coordinate space (from rawRect in map-levels.json)
const WORLD_W = 1024;
const WORLD_H = 2634;

interface RawRect     { x1: number; y1: number; x2: number; y2: number }
interface WorldBounds { minX: number; maxX: number; minZ: number; maxZ: number }
interface LevelEntry  { id: string; name: string; underground: boolean; rawRect: RawRect; worldBounds?: WorldBounds }

const allLevels: LevelEntry[] = (mapLevelsData as { levels: LevelEntry[] }).levels;
const levelIndex = new Map(allLevels.map(l => [l.id, l]));

// World (x, z) → position in 1024×2634 global map space (mirrors gamma-db worldToMapPixels)
function worldToMapPos(px: number, pz: number, level: LevelEntry) {
	const wb = level.worldBounds!;
	const rr = level.rawRect;
	const normX = (px - wb.minX) / (wb.maxX - wb.minX);
	const normZ = (pz - wb.minZ) / (wb.maxZ - wb.minZ);
	return {
		x: rr.x1 + normX * (rr.x2 - rr.x1),
		y: rr.y2 - normZ * (rr.y2 - rr.y1), // Z inverted: south=y2, north=y1
	};
}

const MIN_ZOOM  = 0.3;
const MAX_ZOOM  = 32;
const ZOOM_STEP = 1.3;

interface MapViewProps {
	actor: ActorInfo | null;
	onClose: () => void;
	gameState?: 'playing' | 'menu' | 'off';
	debug?: boolean;
	runs?: Run[];
	companions?: Companion[];
}

export function MapView({ actor, onClose, gameState = 'off', debug = false, runs, companions }: MapViewProps) {
	const { t } = useI18n();
	const panelRef   = useRef<HTMLDivElement>(null);
	const mapAreaRef = useRef<HTMLDivElement>(null);

	const [zoom, setZoom]                 = useState(1);
	const [pan,  setPan]                  = useState({ x: 0, y: 0 });
	const [areaW, setAreaW]               = useState(480);
	const [areaH, setAreaH]               = useState(800);
	const [follow, setFollow]             = useState(true); // lock to player by default
	const [showDeaths, setShowDeaths]     = useState(true);
	const [showCompanions, setShowCompanions] = useState(true);

	const drag = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
	// True once the user has zoomed/panned/followed — suppresses auto re-fit on resize
	const adjusted = useRef(false);

	// Track mapArea size so the view can re-fit responsively
	useEffect(() => {
		const area = mapAreaRef.current;
		if (!area) return;
		const ro = new ResizeObserver(([e]) => {
			setAreaW(e.contentRect.width);
			setAreaH(e.contentRect.height);
		});
		ro.observe(area);
		return () => ro.disconnect();
	}, []);

	const levelId   = actor?.location ?? '';
	const levelData = levelIndex.get(levelId) ?? null;
	const hasPos    = actor?.pos_x != null && actor?.pos_z != null;

	const mapPos = hasPos && levelData?.worldBounds && levelData?.rawRect
		? worldToMapPos(actor!.pos_x!, actor!.pos_z!, levelData)
		: null;

	// Tight-fit the current level to the viewport: focus it, fill the area as
	// large as possible while fully visible (small margin), centered. Fitting a
	// 2048–4096px source into the drawer is always a downscale → stays sharp.
	const FIT_MARGIN = 0.07; // 7% breathing room around the level
	const OPEN_ZOOM  = 1.8;  // open/reset zoomed in past the whole-level fit (focused on player)
	const resetView = useCallback((level: LevelEntry | null) => {
		const area = mapAreaRef.current;
		if (!area || !level?.rawRect) return;
		const cw = area.clientWidth  || areaW;
		const ch = area.clientHeight || areaH;
		const mapW = cw;

		const rr = level.rawRect;
		// Level bounds in canvas pixels (at scale 1) — 1 WU = mapW/WORLD_W px (both axes)
		const rw = (rr.x2 - rr.x1) / WORLD_W * mapW;
		const rh = (rr.y2 - rr.y1) / WORLD_W * mapW;

		// Fit to viewport with margin, then zoom in a bit so it opens focused on
		// the player's area rather than the whole level; clamp to zoom range.
		const fit = Math.min(cw / rw, ch / rh) * (1 - FIT_MARGIN);
		const nz  = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit * OPEN_ZOOM));

		const cx = (rr.x1 + rr.x2) / 2 / WORLD_W * mapW;
		const cy = (rr.y1 + rr.y2) / 2 / WORLD_W * mapW;

		setZoom(nz);
		setPan({ x: cw / (2 * nz) - cx, y: ch / (2 * nz) - cy });
		adjusted.current = false; // back to a clean fit
	}, [areaW, areaH]);

	// Re-fit on level change (fresh fit even if the previous level was adjusted)
	useEffect(() => {
		const t = setTimeout(() => resetView(levelData), 40);
		return () => clearTimeout(t);
	}, [levelId, resetView]);

	// Re-fit on viewport resize / orientation change — only if the user hasn't
	// taken over the view (don't yank a manual zoom/pan).
	useEffect(() => {
		if (!adjusted.current) resetView(levelData);
	}, [areaW, areaH, resetView, levelData]);

	// Center the view on a world-space map position at the current zoom
	const centerOn = useCallback((mp: { x: number; y: number }, z: number) => {
		const cx = mp.x / WORLD_W * areaW;
		const cy = mp.y / WORLD_W * areaW; // 1 WU = areaW/WORLD_W px in both axes
		setPan({ x: areaW / (2 * z) - cx, y: areaH / (2 * z) - cy });
	}, [areaW, areaH]);

	// Follow mode — keep the player dot centered as position updates
	useEffect(() => {
		if (follow && mapPos) centerOn(mapPos, zoom);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [follow, mapPos?.x, mapPos?.y, zoom, centerOn]);

	const close = useCallback(() => onClose(), [onClose]);

	// Scroll-to-zoom toward cursor
	useEffect(() => {
		const area = mapAreaRef.current;
		if (!area) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			adjusted.current = true;
			const rect   = area.getBoundingClientRect();
			const cx     = e.clientX - rect.left;
			const cy     = e.clientY - rect.top;
			const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
			setZoom(z => {
				const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor));
				setPan(p => ({ x: p.x + cx * (1 / nz - 1 / z), y: p.y + cy * (1 / nz - 1 / z) }));
				return nz;
			});
		};
		area.addEventListener('wheel', onWheel, { passive: false });
		return () => area.removeEventListener('wheel', onWheel);
	}, []);

	// Drag-to-pan — manual panning breaks follow mode
	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		e.preventDefault();
		adjusted.current = true;
		if (follow) setFollow(false);
		drag.current = { active: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
	};

	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!drag.current.active) return;
			setPan({
				x: drag.current.panX + (e.clientX - drag.current.startX) / zoom,
				y: drag.current.panY + (e.clientY - drag.current.startY) / zoom,
			});
		};
		const onUp = () => { drag.current.active = false; };
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup',   onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup',   onUp);
		};
	}, [zoom]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape')             { close(); return; }
			if (e.key === 'r' || e.key === 'R') { resetView(levelData); return; }
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [close, resetView, levelData]);

	const onBackdropClick = (e: React.MouseEvent) => {
		if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
	};

	// Marker size peaks gently around the single-level overview (~4×) so the
	// player is easy to spot, tapering to base (24px) both zoomed into the
	// streets (~32×) and zoomed way out (≤0.5×). Peak ≈ 1.6× (≈38px).
	const markerGrow = Math.min(1.6, Math.max(1, 1.6 - 0.2 * Math.abs(Math.log2(zoom / 4))));

	// Player position in SCREEN pixels (so the marker can be rendered outside the
	// scaled .world layer → vector stays crisp at any zoom instead of being
	// magnified from a sub-pixel render). 1 world-unit = areaW/WORLD_W px both axes.
	const screenPos = mapPos
		? {
			x: zoom * (mapPos.x / WORLD_W * areaW + pan.x),
			y: zoom * (mapPos.y / WORLD_W * areaW + pan.y),
		}
		: null;

	// Compute death marker positions.
	// Runs with exact coords get individual pins; runs without coords are grouped
	// by zone and shown at the level center with a count badge.
	const deathMarkers = useMemo(() => {
		if (!runs?.length) return [];
		type Marker = { key: string; cx: number; cy: number; count: number; exact: boolean };
		const markers: Marker[] = [];
		const zoneGroups = new Map<string, number>();

		for (const run of runs) {
			if (!run.death_location) continue;
			const level = levelIndex.get(run.death_location);
			if (!level?.rawRect || !level.worldBounds) continue;

			if (run.death_pos_x != null && run.death_pos_z != null) {
				const mp = worldToMapPos(run.death_pos_x, run.death_pos_z, level);
				markers.push({ key: `exact-${run.id}`, cx: mp.x, cy: mp.y, count: 1, exact: true });
			} else {
				zoneGroups.set(run.death_location, (zoneGroups.get(run.death_location) ?? 0) + 1);
			}
		}

		for (const [levelId, count] of zoneGroups) {
			const level = levelIndex.get(levelId);
			if (!level?.rawRect) continue;
			markers.push({
				key: `zone-${levelId}`,
				cx: (level.rawRect.x1 + level.rawRect.x2) / 2,
				cy: (level.rawRect.y1 + level.rawRect.y2) / 2,
				count,
				exact: false,
			});
		}
		return markers;
	}, [runs]);

	return (
		<div className={styles.backdrop} role="dialog" aria-modal aria-label="Full map" onMouseDown={onBackdropClick}>
			<div className={styles.panel} ref={panelRef}>
				<div className="hud-frame" aria-hidden="true" />

				<div className={styles.header}>
					<span className={styles.label}>◈ {t('map.title')}</span>
					<span className={styles.zoneName}>
						{t(`level.${levelId}`) !== `level.${levelId}` ? t(`level.${levelId}`) : (levelData?.name ?? levelId ?? '—')}
					</span>
					<div className={styles.headerRight}>
						<button
							className={`${styles.followBtn} ${follow ? styles.followOn : ''}`}
							onClick={() => {
								const next = !follow;
								setFollow(next);
								if (next && mapPos) { adjusted.current = true; centerOn(mapPos, zoom); }
							}}
							disabled={!mapPos}
							title={mapPos ? (follow ? t('map.lockTitleOn') : t('map.lockTitleOff')) : t('map.lockTitleNoPos')}
							aria-pressed={follow}
						>
							{follow ? `🔒 ${t('map.lockOn')}` : `🔓 ${t('map.lockOff')}`}
						</button>
						<button className={styles.resetBtn} onClick={() => resetView(levelData)} title={t('map.resetTitle')}>
							{zoom.toFixed(1)}× · {t('map.reset')}
						</button>
						<button className={styles.closeBtn} onClick={close} aria-label={t('map.close')}>✕</button>
					</div>
				</div>

				<div
					className={styles.mapArea}
					ref={mapAreaRef}
					onMouseDown={onMouseDown}
					style={{ cursor: drag.current.active ? 'grabbing' : 'grab' }}
				>
					<div
						className={styles.world}
						style={{
							transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
							transformOrigin: '0 0',
							// Glide to new positions (follow / resets); instant while dragging
							transition: drag.current.active ? 'none' : 'transform 0.45s ease-out',
						}}
					>
						{/* Global backdrop — single downscaled image covering the whole
						    1024×2634 world space (context behind the current level). */}
						<img
							src={mapUrl('global-web.webp')}
							className={styles.globalImg}
							alt=""
							draggable={false}
						/>

						{/* Current level — full-resolution PNG, browser-scaled (max quality).
						    Positioned at its rawRect in world space. */}
						{levelData?.rawRect && !levelData.underground && (
							<img
								src={mapUrl(`${levelId}.webp`)}
								className={styles.levelImg}
								style={{
									left:   `${levelData.rawRect.x1 / WORLD_W * 100}%`,
									top:    `${levelData.rawRect.y1 / WORLD_H * 100}%`,
									width:  `${(levelData.rawRect.x2 - levelData.rawRect.x1) / WORLD_W * 100}%`,
									height: `${(levelData.rawRect.y2 - levelData.rawRect.y1) / WORLD_H * 100}%`,
								}}
								alt={levelData.name}
								draggable={false}
							/>
						)}

					</div>

					{/* Player marker — rendered in screen space so the vector stays sharp */}
					{screenPos && (
						<div
							className={styles.playerOverlay}
							style={{
								left: screenPos.x,
								top: screenPos.y,
								transition: drag.current.active ? 'none' : 'left 0.45s ease-out, top 0.45s ease-out',
							}}
							aria-label="Player position"
						>
							{zoom >= 16 && (
								<span className={styles.ping} style={{ width: Math.round(24 * markerGrow), height: Math.round(24 * markerGrow) }} />
							)}
							{(() => {
								const sz = Math.round(24 * markerGrow);
								return (
									<div style={{
										position: 'absolute',
										width: sz,
										height: sz,
										left: 0,
										top: 0,
										transform: `translate(-50%, -50%)${gameState === 'playing' ? ` rotate(${actor?.heading ?? 0}deg)` : ''}`,
										filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))',
									}}>
										{gameState === 'playing'
											? <NavigationArrow width="100%" height="100%" weight="fill" color="#F17370" />
											: <Skull width="100%" height="100%" weight="fill" color="var(--color-danger)" />
										}
									</div>
								);
							})()}
						</div>
					)}

					{/* Debug: exact computed map point */}
					{debug && screenPos && (
						<div className={styles.calibCross} style={{ left: screenPos.x, top: screenPos.y }} />
					)}

					{debug && (
						<div className={styles.debugBox}>
							<div>zoom {zoom.toFixed(1)}×</div>
							<div>map px {mapPos ? `${mapPos.x.toFixed(1)}, ${mapPos.y.toFixed(1)}` : '—'}</div>
							<div className={styles.debugHint}>{t('map.debugCross')}</div>
						</div>
					)}

					{/* Death markers — screen-space skulls at zone centers */}
					{showDeaths && deathMarkers.map(dm => {
						const sx = zoom * (dm.cx / WORLD_W * areaW + pan.x);
						const sy = zoom * (dm.cy / WORLD_W * areaW + pan.y);
						return (
							<div key={dm.key} className={styles.deathOverlay} style={{ left: sx, top: sy }}>
								<div className={styles.deathMarker}>
									<SmileyXEyes size={20} weight="fill" color="var(--color-danger)" />
									{dm.count > 1 && <span className={styles.deathCount}>×{dm.count}</span>}
								</div>
							</div>
						);
					})}

					{/* Companion markers — screen-space pins when position available */}
					{showCompanions && companions?.map(c => {
						if (c.pos_x == null || c.pos_z == null || !c.level) return null;
						const cLevel = levelIndex.get(c.level);
						if (!cLevel?.rawRect || !cLevel.worldBounds) return null;
						const mp = worldToMapPos(c.pos_x, c.pos_z, cLevel);
						const sx = zoom * (mp.x / WORLD_W * areaW + pan.x);
						const sy = zoom * (mp.y / WORLD_W * areaW + pan.y);
						const factionColor = FACTION_COLORS[c.faction] ?? '#e8c46a';
						return (
							<div key={c.name} className={styles.companionOverlay} style={{ left: sx, top: sy }}>
								<div className={styles.companionMarker}>
									<UserCircleDashed size={22} weight="fill" color={factionColor} />
									<span className={styles.companionName} style={{ color: factionColor }}>{c.name}</span>
									<div className={styles.companionHpTrack}>
										<div className={styles.companionHpFill} style={{ width: `${c.health}%`, background: hp_color(c.health) }} />
									</div>
								</div>
							</div>
						);
					})}

					{/* Legend */}
					<div className={styles.legend}>
						{!!deathMarkers.length && (
							<button
								className={`${styles.legendBtn} ${showDeaths ? styles.legendBtnOn : ''}`}
								onClick={() => setShowDeaths(d => !d)}
							>
								<SmileyXEyes size={11} weight="fill" />
								{t('map.legend.deaths')} ({deathMarkers.length})
							</button>
						)}
						{!!companions?.length && (
							<button
								className={`${styles.legendBtn} ${showCompanions ? styles.legendBtnOn : ''}`}
								onClick={() => setShowCompanions(c => !c)}
							>
								{t('map.legend.companions')} ({companions.length})
							</button>
						)}
					</div>
				</div>

				<div className={styles.footer}>
					{hasPos ? (
						<>
							<span className={styles.coordLabel}>X</span>
							<span className={styles.coordVal}>{actor!.pos_x!.toFixed(1)}</span>
							<span className={styles.coordSep}>·</span>
							<span className={styles.coordLabel}>Z</span>
							<span className={styles.coordVal}>{actor!.pos_z!.toFixed(1)}</span>
						</>
					) : (
						<span className={styles.coordDim}>{t('map.posUnavailable')}</span>
					)}
					<span className={styles.footerHint}>{t('map.hint')}</span>
				</div>
			</div>
		</div>
	);
}
