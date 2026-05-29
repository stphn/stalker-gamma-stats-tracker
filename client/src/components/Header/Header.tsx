import { useI18n } from '../../i18n/I18nContext';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import styles from './Header.module.css';

interface HeaderProps {
	connected: boolean;
	gameState: 'playing' | 'menu' | 'off';
	onMapOpen: () => void;
}

export function Header({ connected, gameState, onMapOpen }: HeaderProps) {
	const { t } = useI18n();
	const serverColor = connected ? 'green' : 'red';
	const gameColor =
		gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red';

	const gameStatus =
		gameState === 'playing' ? t('status.inSession') : gameState === 'menu' ? t('status.inMenu') : t('status.offline');

	return (
		<header className={styles.header}>
			<div className="hud-frame" aria-hidden="true" />
			<div className={styles.logo}>
				<h1 className={styles.title}>T.R.A.C.K.E.R.</h1>
				<p className={styles.tagline}>{t('header.tagline')}</p>
			</div>
			<nav className={styles.nav} aria-label="Site navigation">
				<button className={styles.navLink} onClick={onMapOpen}>{t('nav.map')}</button>
				<span className={styles.navSep} aria-hidden="true">|</span>
				<a href="#" className={styles.navLink}>{t('nav.mods')}</a>
				<span className={styles.navSep} aria-hidden="true">|</span>
				<a href="#" className={styles.navLink}>{t('nav.about')}</a>
				<span className={styles.navSep} aria-hidden="true">|</span>
				<LanguageSwitcher />
			</nav>
			<output className={styles.statusGroup} aria-label="Connection status">
				<div className={`${styles.pill} ${styles[serverColor]}`}>
					<span className={styles.dot} aria-hidden="true" />
					<span className={styles.pillLabel}>{t('status.srv')}</span>
					<span className={styles.pillSep} aria-hidden="true">·</span>
					<span className={styles.pillStatus}>
						{connected ? t('status.connected') : t('status.offline')}
					</span>
				</div>
				<div className={`${styles.pill} ${styles[gameColor]}`}>
					<span className={styles.dot} aria-hidden="true" />
					<span className={styles.pillLabel}>{t('status.game')}</span>
					<span className={styles.pillSep} aria-hidden="true">·</span>
					<span className={styles.pillStatus}>{gameStatus}</span>
				</div>
			</output>
		</header>
	);
}
