import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { de } from './locales/de';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { uk } from './locales/uk';

export type Locale = 'en' | 'de' | 'fr' | 'uk';

export const LOCALES: { code: Locale; label: string }[] = [
	{ code: 'en', label: 'EN' },
	{ code: 'de', label: 'DE' },
	{ code: 'fr', label: 'FR' },
	{ code: 'uk', label: 'UK' },
];

const DICTS: Record<Locale, Record<string, string>> = { en, de, fr, uk };

const STORAGE_KEY = 'tracker_locale';

function detectLocale(): Locale {
	try {
		const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
		if (saved && DICTS[saved]) return saved;
	} catch {}
	const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2);
	return (['de', 'fr', 'uk'] as const).includes(nav as 'de') ? (nav as Locale) : 'en';
}

interface I18nValue {
	locale: Locale;
	setLocale: (l: Locale) => void;
	t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(detectLocale);

	useEffect(() => {
		try { document.documentElement.lang = locale; } catch {}
	}, [locale]);

	const setLocale = useCallback((l: Locale) => {
		setLocaleState(l);
		try { localStorage.setItem(STORAGE_KEY, l); } catch {}
	}, []);

	const t = useCallback(
		(key: string, params?: Record<string, string | number>) => {
			let s = DICTS[locale][key] ?? en[key] ?? key;
			if (params) {
				for (const [k, v] of Object.entries(params)) {
					s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
				}
			}
			return s;
		},
		[locale],
	);

	const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error('useI18n must be used within I18nProvider');
	return ctx;
}
