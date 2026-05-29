import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActorInfo } from '../../types';
import mapLevelsData from '../../data/map-levels.json';
import styles from './MapView.module.css';

// World coordinate space (from rawRect in map-levels.json)
const WORLD_W   = 1024;
const WORLD_H   = 2634;
// Tile geometry helpers
const tileWU   = (z: number) => WORLD_W / Math.pow(2, z);
const tileCols = (z: number) => Math.pow(2, z);
const tileRows = (z: number) => Math.ceil(WORLD_H / tileWU(z));


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

// Screen pixels per world-unit at the current view — accounts for the
// element width AND device pixel ratio (a 2× display needs 2× tile detail
// to render crisply, which the naive zoom→Z mapping ignored).
function screenPxPerWU(cssZoom: number, areaW: number): number {
	const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
	return cssZoom * areaW / WORLD_W * dpr;
}

// Pick the smallest tile Z whose resolution (0.25·2^Z px/world-unit) meets or
// exceeds the screen's pixel density — i.e. tiles are never upsampled on screen.
function pickZ(cssZoom: number, areaW: number, minZ: number, maxZ: number): number {
	const need = screenPxPerWU(cssZoom, areaW);
	const z = Math.ceil(Math.log2(4 * need)); // 0.25·2^Z ≥ need  ⇒  Z ≥ log2(4·need)
	return Math.max(minZ, Math.min(maxZ, z));
}

const GLOBAL_MIN_Z = 2, GLOBAL_MAX_Z = 4;

function getGlobalZ(cssZoom: number, areaW: number): number {
	return pickZ(cssZoom, areaW, GLOBAL_MIN_Z, GLOBAL_MAX_Z);
}

interface TileRef { Z: number; X: number; Y: number; WU: number }

function visibleTileRange(
	Z: number,
	pan: { x: number; y: number },
	zoom: number,
	vw: number, // viewport width
	vh: number, // viewport height
	mapW: number, // world canvas CSS width at scale 1
): TileRef[] {
	// A world point at (wx,wy) has canvas-px (wx/W*mapW, wy/W*mapW) [same formula for both axes]
	// After transform: screen = zoom*(canvas + pan)
	// Visible world range:
	const WU = tileWU(Z);
	const wxMin = -pan.x * WORLD_W / mapW;
	const wxMax = (vw / zoom - pan.x) * WORLD_W / mapW;
	const wyMin = -pan.y * WORLD_W / mapW;
	const wyMax = (vh / zoom - pan.y) * WORLD_W / mapW;

	const buf  = 1;
	const xMin = Math.max(0,            Math.floor(wxMin / WU) - buf);
	const xMax = Math.min(tileCols(Z)-1, Math.ceil(wxMax  / WU) + buf);
	const yMin = Math.max(0,            Math.floor(wyMin / WU) - buf);
	const yMax = Math.min(tileRows(Z)-1, Math.ceil(wyMax  / WU) + buf);

	const tiles: TileRef[] = [];
	for (let X = xMin; X <= xMax; X++)
		for (let Y = yMin; Y <= yMax; Y++)
			tiles.push({ Z, X, Y, WU });
	return tiles;
}

const MIN_ZOOM  = 0.3;
const MAX_ZOOM  = 32;
const ZOOM_STEP = 1.3;

interface MapViewProps {
	actor: ActorInfo | null;
	onClose: () => void;
}

export function MapView({ actor, onClose }: MapViewProps) {
	const panelRef   = useRef<HTMLDivElement>(null);
	const mapAreaRef = useRef<HTMLDivElement>(null);

	const [zoom, setZoom]                 = useState(1);
	const [pan,  setPan]                  = useState({ x: 0, y: 0 });
	const [areaW, setAreaW]               = useState(480);
	const [areaH, setAreaH]               = useState(800);
	const [follow, setFollow]             = useState(false);

	const drag = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });

	// Track mapArea size for tile visibility calculation
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

	// Compute initial zoom+pan to show current level + context
	const resetView = useCallback((level: LevelEntry | null) => {
		const area = mapAreaRef.current;
		if (!area || !level?.rawRect) return;
		const cw = area.clientWidth  || areaW;
		const ch = area.clientHeight || areaH;
		const mapW = cw;

		const rr   = level.rawRect;
		const padX = (rr.x2 - rr.x1) * 0.9;
		const padY = (rr.y2 - rr.y1) * 0.9;
		const x1   = Math.max(0,       rr.x1 - padX);
		const y1   = Math.max(0,       rr.y1 - padY);
		const x2   = Math.min(WORLD_W, rr.x2 + padX);
		const y2   = Math.min(WORLD_H, rr.y2 + padY);

		// Region in canvas pixels (at scale 1)
		const rw = (x2 - x1) / WORLD_W * mapW;
		const rh = (y2 - y1) / WORLD_W * mapW; // same denominator — 1 WU = mapW/WORLD_W px
		const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(cw / rw, ch / rh) * 0.92));

		const cx = (x1 + x2) / 2 / WORLD_W * mapW;
		const cy = (y1 + y2) / 2 / WORLD_W * mapW;

		setZoom(nz);
		setPan({ x: cw / (2 * nz) - cx, y: ch / (2 * nz) - cy });
	}, [areaW, areaH]);

	useEffect(() => {
		const t = setTimeout(() => resetView(levelData), 40);
		return () => clearTimeout(t);
	}, [levelId, resetView]);

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
			if (e.key === 'Escape')             close();
			if (e.key === 'r' || e.key === 'R') resetView(levelData);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [close, resetView, levelData]);

	const onBackdropClick = (e: React.MouseEvent) => {
		if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
	};

	// Tile selection — global and level are decoupled so level tiles appear early
	const globalZ = useMemo(() => getGlobalZ(zoom, areaW), [zoom, areaW]);

	const globalTiles = useMemo(
		() => visibleTileRange(globalZ, pan, zoom, areaW, areaH, areaW),
		[globalZ, pan, zoom, areaW, areaH],
	);

	// CSS % position for a tile in the world canvas
	function tileStyle(t: TileRef): React.CSSProperties {
		return {
			position: 'absolute',
			left:   `${t.X * t.WU / WORLD_W * 100}%`,
			top:    `${t.Y * t.WU / WORLD_H * 100}%`,
			width:  `${t.WU / WORLD_W * 100}%`,
			height: `${t.WU / WORLD_H * 100}%`,
		};
	}

	const dotScale = `translate(-50%, -50%) scale(${1 / zoom})`;

	return (
		<div className={styles.backdrop} role="dialog" aria-modal aria-label="Full map" onMouseDown={onBackdropClick}>
			<div className={styles.panel} ref={panelRef}>
				<div className="hud-frame" aria-hidden="true" />

				<div className={styles.header}>
					<span className={styles.label}>◈ MAP</span>
					<span className={styles.zoneName}>{levelData?.name ?? levelId ?? '—'}</span>
					<div className={styles.headerRight}>
						<button
							className={`${styles.followBtn} ${follow ? styles.followOn : ''}`}
							onClick={() => {
								const next = !follow;
								setFollow(next);
								if (next && mapPos) centerOn(mapPos, zoom);
							}}
							disabled={!mapPos}
							title={mapPos ? (follow ? 'Following player — click to free-pan' : 'Follow player') : 'Player position unavailable'}
							aria-pressed={follow}
						>
							📍 {follow ? 'Following' : 'Follow'}
						</button>
						<button className={styles.resetBtn} onClick={() => resetView(levelData)} title="Reset view (R)">
							{zoom.toFixed(1)}× · Reset
						</button>
						<button className={styles.closeBtn} onClick={close} aria-label="Close map">✕</button>
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
						style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: '0 0' }}
					>
						{/* Global background tiles (JPG) */}
						{globalTiles.map(t => (
							<img
								key={`g${t.Z}-${t.X}-${t.Y}`}
								src={`/tiles/${t.Z}/${t.X}/${t.Y}.jpg`}
								className={styles.tile}
								style={tileStyle(t)}
								alt=""
								draggable={false}
							/>
						))}

						{/* Current level — full-resolution PNG, browser-scaled (max quality,
						    no tile downsampling). Positioned at its rawRect in world space. */}
						{levelData?.rawRect && !levelData.underground && (
							<img
								src={`/maps/${levelId}.png`}
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

						{/* Player dot */}
						{mapPos && (
							<div
								className={styles.dot}
								style={{
									left:      `${mapPos.x / WORLD_W * 100}%`,
									top:       `${mapPos.y / WORLD_H * 100}%`,
									transform: dotScale,
								}}
								aria-label="Player position"
							/>
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
						<span className={styles.coordDim}>Position unavailable — load a save in-game</span>
					)}
					<span className={styles.footerHint}>scroll · drag · R to reset</span>
				</div>
			</div>
		</div>
	);
}
