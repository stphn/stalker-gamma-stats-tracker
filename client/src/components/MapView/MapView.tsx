import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	CampfireIcon,
	GearIcon,
	MapPinIcon,
	NavigationArrowIcon,
	PackageIcon,
	SignpostIcon,
	SmileyXEyesIcon,
	ToggleLeftIcon,
	ToggleRightIcon,
	UserCircleDashedIcon,
	UsersThreeIcon,
} from '@phosphor-icons/react';
import type { ActorInfo, Companion, Run } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import mapLevelsData from '../../data/map-levels.json';
import { mapUrl } from '../../utils/mapsBase';
import { hp_color } from '../../utils/formatters';
import { FACTION_COLORS } from '../../utils/constants';
import {
	FACTION_TERRITORY_COLORS,
	NPC_ROLE_COLORS,
	loadMapEntities,
	shortPlace,
	type MapEntities,
} from '../../utils/mapEntities';
import { FactionIcon } from '../FactionIcon/FactionIcon';
import styles from './MapView.module.css';

// World coordinate space (from rawRect in map-levels.json)
const WORLD_W = 1024;
const WORLD_H = 2634;

// Death markers (and the dead-player marker) use the danger red so they read at a
// glance over bright level art; shape (skull) keeps them distinct from the live
// player/companion markers. var() resolves in Phosphor's color prop + inline styles.
const DEATH_RED = 'var(--color-danger)';

// Persisted legend toggles. Deaths/companions default on; the denser entity
// layers default off so the map opens uncluttered (caller passes the default).
const LS_SHOW_DEATHS     = 'tracker_map_show_deaths';
const LS_SHOW_COMPANIONS = 'tracker_map_show_companions';
const LS_SHOW_LOCATIONS  = 'tracker_map_show_locations';
const LS_SHOW_NPCS       = 'tracker_map_show_npcs';
const LS_SHOW_FACTIONS   = 'tracker_map_show_factions';
const LS_SHOW_CHANGERS   = 'tracker_map_show_changers';
const LS_SHOW_CAMPFIRES  = 'tracker_map_show_campfires';
const LS_SHOW_STASHES    = 'tracker_map_show_stashes';
function loadToggle(key: string, fallback = true): boolean {
	try {
		const v = localStorage.getItem(key);
		return v == null ? fallback : v !== 'false';
	} catch { return fallback; }
}
function saveToggle(key: string, value: boolean) {
	try { localStorage.setItem(key, String(value)); } catch {}
}

// Per-layer zoom gates — denser layers only appear once zoomed in enough to read
// them, which also keeps the rendered marker count low via viewport culling.
const FACTION_MIN_ZOOM  = 0.8;  // territory circles read at an overview zoom
const CHANGER_MIN_ZOOM  = 1.0;  // changers are rare + at zone edges → show early
const NPC_MIN_ZOOM      = 2.4;
const CAMPFIRE_MIN_ZOOM = 3.0;
const LOCATION_MIN_ZOOM = 3.5;
const STASH_MIN_ZOOM    = 5.0;  // 1171 of them → only when zoomed right in
// Off-screen margin (px) kept around the viewport when culling markers.
const CULL_MARGIN = 120;

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

// A level only loads its full-res webp once it occupies at least this many screen
// pixels (the current level is always loaded). Mounting the <img> triggers the
// lazy fetch, so detail streams in as you zoom toward a region.
const HIRES_MIN_ONSCREEN_PX = 200;

/** One level's full-res image, positioned in world space, fading in on load. */
function LevelImage({ level }: { level: LevelEntry }) {
	const [loaded, setLoaded] = useState(false);
	const rr = level.rawRect;
	return (
		<img
			src={mapUrl(`${level.id}.webp`)}
			className={styles.levelImg}
			style={{
				left:    `${rr.x1 / WORLD_W * 100}%`,
				top:     `${rr.y1 / WORLD_H * 100}%`,
				width:   `${(rr.x2 - rr.x1) / WORLD_W * 100}%`,
				height:  `${(rr.y2 - rr.y1) / WORLD_H * 100}%`,
				opacity: loaded ? 1 : 0,
			}}
			alt={level.name}
			draggable={false}
			decoding="async"
			onLoad={() => setLoaded(true)}
		/>
	);
}

/** One layer row in the settings popover: icon · label · ToggleLeft/Right state. */
function ToggleRow({ icon, label, on, onToggle }: {
	icon: React.ReactNode; label: string; on: boolean; onToggle: () => void;
}) {
	return (
		<button
			className={styles.settingsRow}
			onClick={onToggle}
			role="menuitemcheckbox"
			aria-checked={on}
		>
			<span className={styles.settingsRowIcon}>{icon}</span>
			<span className={styles.settingsRowLabel}>{label}</span>
			<span className={on ? styles.toggleOn : styles.toggleOff}>
				{on
					? <ToggleRightIcon size={20} weight="fill" />
					: <ToggleLeftIcon size={20} weight="fill" />}
			</span>
		</button>
	);
}

// Idle time after the last user pan/zoom before the view re-centers on the
// player and follows them — keeps the marker in view without manual scrolling.
const RECENTER_IDLE_MS = 8000;

interface MapViewProps {
	actor: ActorInfo | null;
	onClose: () => void;
	gameState?: 'playing' | 'menu' | 'dead' | 'off';
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
	const [showDeaths, setShowDeaths]     = useState(() => loadToggle(LS_SHOW_DEATHS));
	const [showCompanions, setShowCompanions] = useState(() => loadToggle(LS_SHOW_COMPANIONS));
	const [showLocations, setShowLocations]   = useState(() => loadToggle(LS_SHOW_LOCATIONS, false));
	const [showNpcs, setShowNpcs]             = useState(() => loadToggle(LS_SHOW_NPCS, true));
	const [showFactions, setShowFactions]     = useState(() => loadToggle(LS_SHOW_FACTIONS, false));
	const [showChangers, setShowChangers]     = useState(() => loadToggle(LS_SHOW_CHANGERS, false));
	const [showCampfires, setShowCampfires]   = useState(() => loadToggle(LS_SHOW_CAMPFIRES, false));
	const [showStashes, setShowStashes]       = useState(() => loadToggle(LS_SHOW_STASHES, false));
	useEffect(() => { saveToggle(LS_SHOW_DEATHS, showDeaths); }, [showDeaths]);
	useEffect(() => { saveToggle(LS_SHOW_COMPANIONS, showCompanions); }, [showCompanions]);
	useEffect(() => { saveToggle(LS_SHOW_LOCATIONS, showLocations); }, [showLocations]);
	useEffect(() => { saveToggle(LS_SHOW_NPCS, showNpcs); }, [showNpcs]);
	useEffect(() => { saveToggle(LS_SHOW_FACTIONS, showFactions); }, [showFactions]);
	useEffect(() => { saveToggle(LS_SHOW_CHANGERS, showChangers); }, [showChangers]);
	useEffect(() => { saveToggle(LS_SHOW_CAMPFIRES, showCampfires); }, [showCampfires]);
	useEffect(() => { saveToggle(LS_SHOW_STASHES, showStashes); }, [showStashes]);

	// Layer settings popover (replaces the old always-on legend stack).
	const [settingsOpen, setSettingsOpen] = useState(false);

	// Static map entities (locations / NPCs / level changers) — lazy-loaded once.
	const [entities, setEntities] = useState<MapEntities | null>(null);
	useEffect(() => { loadMapEntities().then(setEntities).catch(() => {}); }, []);

	const drag = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
	// True once the user has zoomed/panned/followed — suppresses auto re-fit on resize
	const adjusted = useRef(false);
	// Follow mode: after RECENTER_IDLE_MS of no interaction, the view tracks the player
	const [following, setFollowing] = useState(false);
	const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

	// A user gesture suspends follow mode and restarts the idle countdown that
	// eventually re-enables it.
	const bumpIdle = useCallback(() => {
		setFollowing(false);
		if (idleTimer.current) clearTimeout(idleTimer.current);
		idleTimer.current = setTimeout(() => setFollowing(true), RECENTER_IDLE_MS);
	}, []);

	// Start the countdown on open so the view eases into follow mode after the
	// first idle window (rather than snapping to the player immediately).
	useEffect(() => {
		bumpIdle();
		return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
	}, [bumpIdle]);

	// While following, keep the player centered as they move (current zoom kept).
	// Depend on the scalar coords so this only fires on real movement, not every render.
	const pmx = mapPos?.x, pmy = mapPos?.y;
	useEffect(() => {
		if (!following || pmx == null || pmy == null) return;
		const area = mapAreaRef.current;
		if (!area) return;
		const cw = area.clientWidth  || areaW;
		const ch = area.clientHeight || areaH;
		setPan({
			x: cw / (2 * zoom) - pmx / WORLD_W * areaW,
			y: ch / (2 * zoom) - pmy / WORLD_W * areaW,
		});
	}, [following, pmx, pmy, zoom, areaW, areaH]);

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

	const close = useCallback(() => onClose(), [onClose]);

	// Scroll-to-zoom toward cursor
	useEffect(() => {
		const area = mapAreaRef.current;
		if (!area) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			adjusted.current = true;
			bumpIdle();
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
	}, [bumpIdle]);

	// Drag-to-pan
	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		e.preventDefault();
		adjusted.current = true;
		bumpIdle();
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
			// Escape closes the layer popover first, then the map.
			if (e.key === 'Escape') {
				if (settingsOpen) { setSettingsOpen(false); return; }
				close();
				return;
			}
			if (e.key === 'r' || e.key === 'R') { bumpIdle(); resetView(levelData); return; }
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [close, resetView, levelData, bumpIdle, settingsOpen]);

	// Close the layer popover on any click outside it.
	const settingsRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!settingsOpen) return;
		const onDown = (e: MouseEvent) => {
			if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
				setSettingsOpen(false);
			}
		};
		window.addEventListener('mousedown', onDown);
		return () => window.removeEventListener('mousedown', onDown);
	}, [settingsOpen]);

	const onBackdropClick = (e: React.MouseEvent) => {
		if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
	};


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

		const exactZones = new Set<string>();

		for (const run of runs) {
			if (!run.death_location) continue;
			const level = levelIndex.get(run.death_location);
			if (!level?.rawRect || !level.worldBounds) continue;

			if (run.death_pos_x != null && run.death_pos_z != null) {
				const mp = worldToMapPos(run.death_pos_x, run.death_pos_z, level);
				markers.push({ key: `exact-${run.id}`, cx: mp.x, cy: mp.y, count: 1, exact: true });
				exactZones.add(run.death_location);
			} else {
				zoneGroups.set(run.death_location, (zoneGroups.get(run.death_location) ?? 0) + 1);
			}
		}

		// Only show zone-center fallback for zones that have no exact pins —
		// avoids duplicate markers when old (pre-tracking) and new runs coexist.
		for (const [levelId, count] of zoneGroups) {
			if (exactZones.has(levelId)) continue;
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

	// Map-pixel → screen-pixel (markers live outside the scaled .world layer so
	// they stay crisp). Mirrors the death/companion transform.
	const toScreen = (mx: number, my: number) => ({
		x: zoom * (mx / WORLD_W * areaW + pan.x),
		y: zoom * (my / WORLD_W * areaW + pan.y),
	});
	// Viewport cull: skip markers well outside the visible area so panning a
	// fully-zoomed map only ever renders the handful of on-screen entities.
	const onScreen = (x: number, y: number, m = CULL_MARGIN) =>
		x >= -m && x <= areaW + m && y >= -m && y <= areaH + m;

	// Progressive high-res: pick the non-underground levels whose area is on
	// screen and big enough to deserve detail (always the current level). A
	// generous margin keeps neighbours mounted across small pans so they don't
	// thrash; off-screen levels unmount to free decoded-image memory.
	const levelMargin = 0.5 * Math.max(areaW, areaH);
	const hiresLevels = allLevels.filter(l => {
		if (l.underground || !l.rawRect) return false;
		const a = toScreen(l.rawRect.x1, l.rawRect.y1);
		const b = toScreen(l.rawRect.x2, l.rawRect.y2);
		const intersects =
			b.x >= -levelMargin && a.x <= areaW + levelMargin &&
			b.y >= -levelMargin && a.y <= areaH + levelMargin;
		if (!intersects) return false;
		if (l.id === levelId) return true;
		return Math.max(b.x - a.x, b.y - a.y) >= HIRES_MIN_ONSCREEN_PX;
	});

	return (
		<div className={styles.backdrop} role="dialog" aria-modal aria-label="Full map" onMouseDown={onBackdropClick}>
			<div className={styles.panel} ref={panelRef}>
				<div className="hud-frame" aria-hidden="true" />

				<div className={styles.header}>
					<span className={styles.label}>◈ {t('map.title')}</span>
					<div className={styles.headerRight}>
						<button className={styles.resetBtn} onClick={() => { bumpIdle(); resetView(levelData); }} title={t('map.resetTitle')}>
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
					{/* Scale layer — zoom only, no transition (avoids compositing-layer
					    bitmap blur: scale+transition rasterizes at initial size then
					    upscales the pixels; translate-only animation doesn't have this). */}
					<div
						className={styles.world}
						style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
					>
						{/* Translate layer — pan only, transition safe here (no scale = no blur) */}
						<div
							className={styles.worldInner}
							style={{
								transform: `translate(${pan.x}px, ${pan.y}px)`,
							}}
						>
							<img
								src={mapUrl('global-web.webp')}
								className={styles.globalImg}
								alt=""
								draggable={false}
							/>
							{hiresLevels.map(l => (
								<LevelImage key={l.id} level={l} />
							))}
						</div>
					</div>

					{/* Player marker — rendered in screen space so the vector stays sharp */}
					{screenPos && (
						<div
							className={styles.playerOverlay}
							style={{
								left: screenPos.x,
								top: screenPos.y,
							}}
							aria-label="Player position"
						>
							{zoom >= 16 && (
								<span className={styles.ping} style={{ width: 22, height: 22 }} />
							)}
							<div style={{
								position: 'absolute',
								width: 22,
								height: 22,
								left: 0,
								top: 0,
								transform: `translate(-50%, -50%) rotate(${gameState === 'dead' ? 0 : (actor?.heading ?? 0) + 45}deg)`,
								filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))',
							}}>
								{gameState === 'dead'
									? <SmileyXEyesIcon width="100%" height="100%" weight="fill" color={DEATH_RED} />
									: <NavigationArrowIcon width="100%" height="100%" weight="fill" color={FACTION_COLORS[actor?.faction ?? ''] ?? '#e8c46a'} />
								}
							</div>
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
									<div style={{ width: 22, height: 22 }}><SmileyXEyesIcon width="100%" height="100%" weight="fill" color={DEATH_RED} /></div>
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
									<UserCircleDashedIcon size={22} weight="fill" color={factionColor} />
									<span className={styles.companionName} style={{ color: factionColor }}>{c.name}</span>
									<div className={styles.companionHpTrack}>
										<div className={styles.companionHpFill} style={{ width: `${c.health}%`, background: hp_color(c.health) }} />
									</div>
								</div>
							</div>
						);
					})}

					{/* Faction territory — semi-transparent "city" circles behind
					    controlled smart terrains (rendered first → underneath markers). */}
					{showFactions && entities && zoom >= FACTION_MIN_ZOOM &&
						entities.smart_terrain.map((st, i) => {
							const fac = st.factions?.[0];
							if (!fac) return null;
							const rgb = FACTION_TERRITORY_COLORS[fac];
							if (!rgb) return null;
							const { x, y } = toScreen(st.mapX, st.mapY);
							if (!onScreen(x, y, 80)) return null;
							const r = Math.max(10, Math.min(64, 12 * zoom * areaW / WORLD_W));
							return (
								<div
									key={`fac-${i}`}
									className={styles.factionCircle}
									style={{
										left: x, top: y,
										width: r * 2, height: r * 2,
										background: `rgba(${rgb},0.14)`,
										borderColor: `rgba(${rgb},0.55)`,
									}}
								/>
							);
						})}

					{/* Locations — smart-terrain place names */}
					{showLocations && entities && zoom >= LOCATION_MIN_ZOOM &&
						entities.smart_terrain.map((st, i) => {
							if (!st.location) return null;
							const { x, y } = toScreen(st.mapX, st.mapY);
							if (!onScreen(x, y)) return null;
							return (
								<div key={`loc-${i}`} className={styles.locationOverlay} style={{ left: x, top: y }}>
									<span className={styles.locationLabel}>{shortPlace(st.location)}</span>
								</div>
							);
						})}

					{/* Level changers — transitions between zones */}
					{showChangers && entities && zoom >= CHANGER_MIN_ZOOM &&
						entities.level_changer.map((lc, i) => {
							const { x, y } = toScreen(lc.mapX, lc.mapY);
							if (!onScreen(x, y)) return null;
							const dest = lc.name?.match(/to_([a-z0-9_]+?)(?:_\d+)?$/i)?.[1]?.replace(/_/g, ' ');
							return (
								<div key={`lc-${i}`} className={styles.changerOverlay} style={{ left: x, top: y }}>
									<div className={styles.changerMarker}>
										<span className={styles.changerIcon}>
											<SignpostIcon width="100%" height="100%" weight="fill" color="var(--accent-base)" />
										</span>
										{dest && zoom >= CHANGER_MIN_ZOOM && <span className={styles.changerName}>{dest}</span>}
									</div>
								</div>
							);
						})}

					{/* Campfires — GAMMA rest / sleep / cook spots (icon-only) */}
					{showCampfires && entities && zoom >= CAMPFIRE_MIN_ZOOM &&
						entities.campfire.map((c, i) => {
								const { x, y } = toScreen(c.mapX, c.mapY);
								if (!onScreen(x, y)) return null;
								return (
									<div key={`fire-${i}`} className={styles.poiOverlay} style={{ left: x, top: y }}>
										<span className={styles.poiIcon}>
											<CampfireIcon width="100%" height="100%" weight="fill" color="var(--color-warning)" />
										</span>
									</div>
								);
							})}

						{showStashes && entities && zoom >= STASH_MIN_ZOOM &&
							entities.stash.map((s, i) => {
								const { x, y } = toScreen(s.mapX, s.mapY);
								if (!onScreen(x, y)) return null;
								return (
									<div key={`stash-${i}`} className={styles.poiOverlay} style={{ left: x, top: y }}>
										<span className={styles.poiIconSm}>
											<PackageIcon width="100%" height="100%" weight="fill" color="var(--color-info)" />
										</span>
									</div>
								);
							})}

						{/* Notable characters — named NPCs with role colour + faction icon */}
						{showNpcs && entities && zoom >= NPC_MIN_ZOOM &&
							entities.named_npc.map((npc, i) => {
							const { x, y } = toScreen(npc.mapX, npc.mapY);
							if (!onScreen(x, y)) return null;
							const color = NPC_ROLE_COLORS[npc.role ?? 'npc'] ?? NPC_ROLE_COLORS.npc;
							return (
								<div key={`npc-${i}`} className={styles.npcOverlay} style={{ left: x, top: y }}>
									<span className={styles.npcLeader} style={{ background: color }} />
									<span className={styles.npcDot} style={{ background: color, borderColor: color }} />
									<span className={styles.npcName} style={{ color }}>
										{npc.faction && <FactionIcon faction={npc.faction} size="xs" />}
										{npc.char_name ?? shortPlace(npc.location)}
									</span>
								</div>
							);
						})}

					{/* Layer settings popover — gear opens a panel of ToggleLeft/Right rows */}
					<div className={styles.settings} ref={settingsRef} onMouseDown={e => e.stopPropagation()}>
						{settingsOpen && (
							<div className={styles.settingsPanel} role="menu">
								<div className={styles.settingsHead}>
									<span className={styles.settingsTitle}>{t('map.layers')}</span>
									<button
										className={styles.settingsClose}
										onClick={() => setSettingsOpen(false)}
										aria-label={t('map.close')}
									>
										✕
									</button>
								</div>
								{!!deathMarkers.length && (
									<ToggleRow icon={<SmileyXEyesIcon size={13} weight="fill" />} label={t('map.legend.deaths')} on={showDeaths} onToggle={() => setShowDeaths(v => !v)} />
								)}
								{!!companions?.length && (
									<ToggleRow icon={<UserCircleDashedIcon size={13} weight="fill" />} label={t('map.legend.companions')} on={showCompanions} onToggle={() => setShowCompanions(v => !v)} />
								)}
								{entities && (
									<>
										<ToggleRow icon={<UsersThreeIcon size={13} weight="fill" />} label={t('map.legend.npcs')} on={showNpcs} onToggle={() => setShowNpcs(v => !v)} />
										<ToggleRow icon={<MapPinIcon size={13} weight="fill" />} label={t('map.legend.locations')} on={showLocations} onToggle={() => setShowLocations(v => !v)} />
										<ToggleRow icon={<UserCircleDashedIcon size={13} weight="fill" />} label={t('map.legend.factions')} on={showFactions} onToggle={() => setShowFactions(v => !v)} />
										<ToggleRow icon={<SignpostIcon size={13} weight="fill" />} label={t('map.legend.changers')} on={showChangers} onToggle={() => setShowChangers(v => !v)} />
										<ToggleRow icon={<CampfireIcon size={13} weight="fill" />} label={t('map.legend.campfires')} on={showCampfires} onToggle={() => setShowCampfires(v => !v)} />
										<ToggleRow icon={<PackageIcon size={13} weight="fill" />} label={t('map.legend.stashes')} on={showStashes} onToggle={() => setShowStashes(v => !v)} />
									</>
								)}
							</div>
						)}
						<button
							className={`${styles.settingsBtn} ${settingsOpen ? styles.settingsBtnOpen : ''}`}
							onClick={() => setSettingsOpen(o => !o)}
							aria-expanded={settingsOpen}
							title={t('map.layers')}
						>
							<GearIcon size={13} weight="fill" />
							{t('map.layers')}
						</button>
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
