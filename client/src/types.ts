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

export interface SessionBlock extends StatsBlock {
	start: number;
	death_location?: string;
	death_location_name?: string;
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
}

export interface Companion {
	name: string;
	health: number;
	faction: string;
	rank: number;
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
}

export interface StatsData {
	last_updated: number;
	game_state: 'playing' | 'menu';
	session: SessionBlock;
	alltime: StatsBlock;
	alltime_official?: PdaStats;
	actor?: ActorInfo;
	companions?: Companion[];
	last_run?: SessionBlock[];
	achievements: Record<string, Achievement>;
	game_achievements: GameAchievements;
}
