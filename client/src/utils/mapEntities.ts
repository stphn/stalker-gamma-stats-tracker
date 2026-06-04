// Static map entities (locations, notable NPCs, level changers) sourced from the
// stalker-anomaly-gamma-db Lua dump. Coordinates are already projected into the
// same 1024×2634 pixel space MapView uses, so mapX/mapY drop straight into the
// existing screen-space transform — no re-projection needed.

export interface SmartTerrain {
	id: number;
	level: string;
	mapX: number;
	mapY: number;
	/** Translated location name, e.g. "Cordon - Rookie Village". */
	location?: string;
	/** Factions configured to start here — drives the territory "city" circle. */
	factions?: string[];
}

export interface NamedNpc {
	id: number;
	level: string;
	mapX: number;
	mapY: number;
	char_name?: string;
	/** trader | mechanic | medic | barman | guide | leader | arena | npc */
	role?: string;
	faction?: string;
	location?: string;
}

export interface LevelChanger {
	id: number;
	level: string;
	mapX: number;
	mapY: number;
	name?: string;
}

/** Campfire (GAMMA rest/sleep/cook spot) or stash box — icon-only, no readable name. */
export interface MapPoint {
	id: number;
	level: string;
	mapX: number;
	mapY: number;
}

export interface MapEntities {
	smart_terrain: SmartTerrain[];
	named_npc: NamedNpc[];
	level_changer: LevelChanger[];
	campfire: MapPoint[];
	stash: MapPoint[];
}

let cached: Promise<MapEntities> | null = null;

/** Lazy-load the entity bundle (~80 KB) — only fetched the first time the map opens. */
export function loadMapEntities(): Promise<MapEntities> {
	if (!cached) {
		cached = import('../data/map-entities.json').then(
			(m) => (m.default ?? m) as unknown as MapEntities,
		);
	}
	return cached;
}

// Faction territory colours (from gamma-db's MapsView). Used for the semi-
// transparent circle drawn around controlled smart terrains.
export const FACTION_TERRITORY_COLORS: Record<string, string> = {
	stalker: '255,200,0',
	duty: '220,40,40',
	dolg: '220,40,40',
	freedom: '0,180,0',
	bandit: '220,220,220',
	army: '160,50,220',
	monolith: '0,220,220',
	killer: '50,50,50',
	merc: '50,50,50',
	ecolog: '0,200,180',
	csky: '50,120,255',
	renegade: '0,100,40',
	greh: '255,140,0',
	isg: '128,0,0',
	zombied: '180,180,150',
};

// Notable-NPC pin colour by role.
export const NPC_ROLE_COLORS: Record<string, string> = {
	trader: '#e8c46a',
	mechanic: '#5a8ab4',
	medic: '#6abf6a',
	barman: '#d08a3a',
	guide: '#9a7ab4',
	leader: '#c85a5a',
	arena: '#c8a85a',
	npc: '#8a9098',
};

/** Strip the "Zone - " prefix so labels read as the local place name. */
export function shortPlace(location: string | undefined): string {
	if (!location) return '';
	return location.replace(/^[^-]+ - /, '');
}
