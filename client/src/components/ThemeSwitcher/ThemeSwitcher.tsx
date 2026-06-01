import { useState } from 'react';
// Reuse the language switcher's HUD <select> styling.
import styles from '../LanguageSwitcher/LanguageSwitcher.module.css';

/** Add a theme: add an entry here + a `:root[data-theme="id"]` block in App.css. */
export const THEMES = [
	{ id: 'zone', label: 'Zone' },
	{ id: 'dracula', label: 'Dracula' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const STORAGE_KEY = 'tracker_theme';

/** "zone" is the default (:root) — represented by the absence of the attribute. */
export function applyTheme(id: string) {
	const el = document.documentElement;
	if (id && id !== 'zone') el.setAttribute('data-theme', id);
	else el.removeAttribute('data-theme');
}

export function getStoredTheme(): string {
	try { return localStorage.getItem(STORAGE_KEY) ?? 'zone'; } catch { return 'zone'; }
}

export function ThemeSwitcher() {
	const [theme, setTheme] = useState(getStoredTheme);

	const change = (id: string) => {
		setTheme(id);
		applyTheme(id);
		try { localStorage.setItem(STORAGE_KEY, id); } catch {}
	};

	return (
		<select
			className={styles.select}
			value={theme}
			onChange={e => change(e.target.value)}
			aria-label="Theme"
		>
			{THEMES.map(t => (
				<option key={t.id} value={t.id}>{t.label}</option>
			))}
		</select>
	);
}
