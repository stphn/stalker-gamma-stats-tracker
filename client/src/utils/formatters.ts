import { LEVELS } from './constants';

export function fmt_location(raw: string, name?: string) {
	if (name && name !== raw && !name.startsWith('st_level_')) return name;
	return (
		LEVELS[raw] ??
		raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	);
}

export function fmt_time(seconds: number | undefined) {
	if (!seconds) return '0h 0m 0s';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return `${h}h ${m}m ${s}s`;
}

export function fmt_money(n: number | undefined) {
	if (n == null) return '— ₽';
	return `${n.toLocaleString('en-US')} ₽`;
}

// Thresholds from GAMMA game_relations.ltx (161- Improved player and NPCs ranks)
export function rank_label(r: number) {
	if (r >= 50000) return 'Legend';
	if (r >= 35000) return 'Master';
	if (r >= 24000) return 'Expert';
	if (r >= 16000) return 'Veteran';
	if (r >= 10000) return 'Professional';
	if (r >= 6000) return 'Experienced';
	if (r >= 4000) return 'Trainee';
	return 'Novice';
}

export function rep_label(r: number) {
	if (r >= 2000) return 'Excellent';
	if (r >= 500) return 'Good';
	if (r >= -500) return 'Neutral';
	if (r >= -2000) return 'Bad';
	return 'Terrible';
}

export function rep_color(r: number) {
	if (r >= 2000) return '#2ecc71';
	if (r >= 500) return '#27ae60';
	if (r >= -500) return '#95a5a6';
	if (r >= -2000) return '#e67e22';
	return '#e74c3c';
}

export function hp_color(pct: number) {
	if (pct >= 60) return '#2ecc71';
	if (pct >= 30) return '#e8a838';
	return '#e74c3c';
}
