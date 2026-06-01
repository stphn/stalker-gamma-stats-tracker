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

// Compact death-log stamp: day.month.yy + time to the second — players die many
// times a day, so the time of day is what distinguishes runs. Full date is kept
// on the row's hover title. Local time.
export function fmt_run_datetime(epochSeconds: number) {
	const d = new Date(epochSeconds * 1000);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${p(d.getFullYear() % 100)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const LOCALE_TAG: Record<string, string> = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', uk: 'uk-UA' };

export function fmt_money(n: number | undefined, locale = 'en') {
	if (n == null) return '— ₽';
	return `${n.toLocaleString(LOCALE_TAG[locale] ?? 'en-US')} ₽`;
}

// Returns an i18n KEY — caller wraps with t().
// Thresholds from GAMMA game_relations.ltx (161- Improved player and NPCs ranks)
export function rank_label(r: number) {
	if (r >= 50000) return 'rank.legend';
	if (r >= 35000) return 'rank.master';
	if (r >= 24000) return 'rank.expert';
	if (r >= 16000) return 'rank.veteran';
	if (r >= 10000) return 'rank.professional';
	if (r >= 6000) return 'rank.experienced';
	if (r >= 4000) return 'rank.trainee';
	return 'rank.novice';
}

// Returns an i18n KEY — caller wraps with t().
export function rep_label(r: number) {
	if (r >= 2000) return 'rep.excellent';
	if (r >= 500) return 'rep.good';
	if (r >= -500) return 'rep.neutral';
	if (r >= -2000) return 'rep.bad';
	return 'rep.terrible';
}

// Return theme tokens (used in inline styles) so colours follow the active theme.
export function rep_color(r: number) {
	if (r >= 2000) return 'var(--color-positive)';
	if (r >= 500) return 'var(--color-positive)';
	if (r >= -500) return 'var(--text-disabled)';
	if (r >= -2000) return 'var(--color-warning)';
	return 'var(--color-danger)';
}

export function hp_color(pct: number) {
	if (pct >= 60) return 'var(--color-positive)';
	if (pct >= 30) return 'var(--color-warning)';
	return 'var(--color-danger)';
}
