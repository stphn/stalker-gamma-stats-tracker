import type { Locale } from '../../i18n/I18nContext';
import { LOCALES, useI18n } from '../../i18n/I18nContext';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
	/** 'buttons' (default) renders the inline button row; 'select' a HUD dropdown. */
	variant?: 'buttons' | 'select';
}

export function LanguageSwitcher({ variant = 'buttons' }: LanguageSwitcherProps) {
	const { locale, setLocale } = useI18n();

	if (variant === 'select') {
		return (
			<select
				className={styles.select}
				value={locale}
				onChange={(e) => setLocale(e.target.value as Locale)}
				aria-label="Language"
			>
				{LOCALES.map(({ code, label }) => (
					<option key={code} value={code}>{label}</option>
				))}
			</select>
		);
	}

	return (
		<div className={styles.root} role="group" aria-label="Language">
			{LOCALES.map(({ code, label }) => (
				<button
					key={code}
					className={`${styles.lang} ${locale === code ? styles.active : ''}`}
					onClick={() => setLocale(code)}
					aria-pressed={locale === code}
				>
					{label}
				</button>
			))}
		</div>
	);
}
