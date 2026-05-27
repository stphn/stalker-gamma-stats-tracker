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

export function rank_label(r: number) {
	if (r >= 7200) return 'Legend';
	if (r >= 3600) return 'Master';
	if (r >= 1800) return 'Expert';
	if (r >= 900) return 'Veteran';
	if (r >= 300) return 'Experienced';
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
