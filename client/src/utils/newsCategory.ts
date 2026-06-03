import type { NewsItem } from '../types';

/**
 * Buckets a captured Zone News item into a semantic category. Classification is
 * client-side (no game restart to tweak) and matches on both the caption key and
 * the display text, because GAMMA emits tips both as `st_*` keys and as literal
 * English sentences. Shared by every news surface (ticker now, toast/loot later).
 */
export type NewsCategory =
	| 'world'
	| 'progression'
	| 'combat'
	| 'task'
	| 'loot'
	| 'maintenance'
	| 'other'
	| 'noise';

// Ordered: first match wins. `noise` is checked first so debug/UI spam never
// reaches a surface regardless of what else it happens to contain.
const RULES: { category: NewsCategory; re: RegExp }[] = [
	{ category: 'noise', re: /opening pda|closing pda|beep_|tdir|surface comparison|filter_prot|item \[|previous: .* current:/ },
	{ category: 'world', re: /surge|emission|psi|blowout/ },
	// Combat before progression: an ally-kill mentions "reputation" but is combat.
	{ category: 'combat', re: /cold blood|killed|ally|spotted/ },
	// Tightened to the specific change keys so a sentence merely saying
	// "reputation" (e.g. the ally-kill above) isn't swallowed here.
	{ category: 'progression', re: /rank_increased|rank_decreased|reputation_increased|reputation_decreased|rank_change|rep_change|promot/ },
	{ category: 'maintenance', re: /parts|filter|wrong_equip|already_has_equipment|tanks_removed|cleaned|dis_items/ },
	{ category: 'task', re: /task|saharov|message_|pda/ },
];

export function classifyNews(n: NewsItem): NewsCategory {
	if (n.kind === 'loot') return 'loot';
	const hay = `${n.key ?? ''} ${n.text ?? ''}`.toLowerCase();
	for (const { category, re } of RULES) {
		if (re.test(hay)) return category;
	}
	return 'other';
}

/**
 * Per-category presentation. `color` is a theme-aware CSS var (status hues live
 * in App.css `:root`); `tickerVisible: false` keeps a category out of the ticker.
 */
export const CATEGORY_META: Record<NewsCategory, { label: string; color: string; tickerVisible: boolean }> = {
	world:       { label: 'World',       color: 'var(--color-warning)',  tickerVisible: true },
	combat:      { label: 'Combat',      color: 'var(--color-danger)',   tickerVisible: true },
	progression: { label: 'Progression', color: 'var(--color-positive)', tickerVisible: true },
	task:        { label: 'Task',        color: 'var(--color-info)',     tickerVisible: true },
	loot:        { label: 'Loot',        color: 'var(--accent-dim)',     tickerVisible: true },
	maintenance: { label: 'Upkeep',      color: 'var(--text-disabled)',  tickerVisible: true },
	other:       { label: 'Other',       color: 'var(--text-disabled)',  tickerVisible: true },
	noise:       { label: 'Noise',       color: 'var(--text-disabled)',  tickerVisible: false },
};
