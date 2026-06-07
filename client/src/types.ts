export interface Kills {
	total: number;
	stalker: number;
	bandit: number;
	military: number;
	freedom: number;
	duty: number;
	ecolog: number;
	csky: number;
	monolith: number;
	killer: number;
	renegade: number;
	mutant: number;
	helicopter: number;
	other: number;
}

export interface StatsBlock {
	kills: Kills;
	deaths: number;
	tasks: number;
	rubles_earned: number;
	rubles_spent: number;
	artifacts: number;
	items: number;
	stashes: number;
	level_changes: number;
	playtime: number;
}

/**
 * Cross-save persistent stats (`data.alltime`). Extends the base block with the
 * richer fields the mod accumulates across every character on the install. All
 * extras are optional — a mod build that predates them simply omits them and the
 * UI guards each with a 0 default (see `n()` in AllTimePanel).
 */
export interface AllTimeBlock extends StatsBlock {
	distance_m?: number; // metres walked, accumulated from polled actor position
	zone_days?: number; // cumulative in-game days survived
	levels_visited?: number;
	tasks_failed?: number;
	tasks_cancelled?: number;
	pdas_delivered?: number;
	articles?: number;
	emissions?: number;
	psi_storms?: number;
	field_dressings?: number;
	wounded_helped?: number;
	boxes_smashed?: number;
	enemies_surrendered?: number;
}

export interface SessionBlock extends StatsBlock {
	start: number;
	death_location?: string;
	death_location_name?: string;
	death_pos_x?: number;
	death_pos_z?: number;
}

/** Row from the `runs` Supabase table — one entry per death. */
export interface Run {
	id: number;
	start: number;
	playtime: number | null;
	kills: Kills | null;
	rubles_earned: number | null;
	artifacts: number | null;
	tasks: number | null;
	stashes: number | null;
	items: number | null;
	death_location: string | null;
	death_location_name: string | null;
	death_pos_x: number | null;
	death_pos_z: number | null;
	created_at: string;
}

export interface Achievement {
	name: string;
	desc: string;
	at: number;
}

export interface GameAchievements {
	unlocked: Record<string, boolean>;
	earned: number;
	total: number;
}

/** A curated in-game "Zone News" tip captured by the mod. */
export interface NewsItem {
	/**
	 * Event category for routing one stream to many surfaces (ticker / toast /
	 * stacked notifications / feed). 'loot' = item pickup, 'event' = world tip.
	 */
	kind?: string;
	/** Display text (already localized by the game). */
	text: string;
	/** Unix seconds when the tip fired. */
	at: number;
	/** Raw caption key (events) or item section (loot) — for grouping/filtering. */
	key?: string;
}

export interface PdaStats extends StatsBlock {
	current_money?: number;
	tasks_failed: number;
	tasks_cancelled: number;
	emissions: number;
	psi_storms: number;
	pdas_delivered: number;
	boxes_smashed: number;
	wounded_helped: number;
	enemies_surrendered: number;
	field_dressings: number;
	articles: number;
	achievements_count: number;
	levels_visited: number;
	game_days?: number; // in-game "Time Elapsed" in Zone days
}

export interface Companion {
	name: string;
	health: number;
	faction: string;
	rank: number;
	reputation?: number;
	pos_x?: number;
	pos_z?: number;
	level?: string;
}

export interface ActorInfo {
	name: string;
	faction: string;
	rank: number;
	reputation: number;
	money: number;
	location: string;
	location_name?: string;
	game_time?: { h: number; m: number };
	pos_x?: number;
	pos_z?: number;
	heading?: number; // facing in degrees, 0 = north, clockwise
	health?: number; // 0–100
}

export interface StatsData {
	last_updated: number;
	game_state: 'playing' | 'menu';
	session: SessionBlock;
	alltime: AllTimeBlock;
	alltime_official?: PdaStats;
	actor?: ActorInfo;
	companions?: Companion[];
	last_run?: SessionBlock[];
	achievements: Record<string, Achievement>;
	game_achievements: GameAchievements;
	news?: NewsItem[];
}
