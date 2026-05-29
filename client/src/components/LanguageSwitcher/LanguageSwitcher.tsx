import { LOCALES, useI18n } from '../../i18n/I18nContext';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
	const { locale, setLocale } = useI18n();
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
