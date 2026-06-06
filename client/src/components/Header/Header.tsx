import { useEffect, useRef, useState } from 'react';
import { ListIcon, PowerIcon } from '@phosphor-icons/react';
import { useI18n } from '../../i18n/I18nContext';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { ThemeSwitcher } from '../ThemeSwitcher/ThemeSwitcher';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Header.module.css';

interface HeaderProps {
	connected: boolean;
	gameState: 'playing' | 'menu' | 'dead' | 'off';
	onMapOpen: () => void;
}

export function Header({ connected, gameState, onMapOpen }: HeaderProps) {
	const { t } = useI18n();
	const serverColor = connected ? 'green' : 'red';
	const gameColor =
		gameState === 'playing' ? 'green' : gameState === 'dead' ? 'red' : 'orange';

	const gameStatus =
		gameState === 'playing' ? t('status.inSession') : gameState === 'dead' ? t('status.dead') : gameState === 'menu' ? t('status.inMenu') : t('status.offline');

	// Mobile burger menu (nav links + settings). Inline on desktop via CSS; this
	// open state only governs the dropdown shown below the small breakpoint.
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const burgerRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const onDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (menuRef.current?.contains(target) || burgerRef.current?.contains(target)) return;
			setMenuOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setMenuOpen(false);
		};
		document.addEventListener('pointerdown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [menuOpen]);

	const openMap = () => {
		setMenuOpen(false);
		onMapOpen();
	};

	return (
		<header className={styles.header}>
			<div className="hud-frame" aria-hidden="true" />
			<div className={styles.logo}>
				<h1 className={styles.title}>T.R.A.C.K.E.R.</h1>
				<p className={styles.tagline}>{t('header.tagline')}</p>
			</div>
			<button
				type="button"
				ref={burgerRef}
				className={styles.burger}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				aria-label={t('nav.menu')}
				onClick={() => setMenuOpen(o => !o)}
			>
				<ListIcon className={styles.burgerIcon} weight="bold" aria-hidden="true" />
			</button>
			<div className={styles.menu} data-open={menuOpen} ref={menuRef}>
				<nav className={styles.nav} aria-label="Site navigation">
					<button className={styles.navLink} onClick={openMap}>{t('nav.map')}</button>
					<span className={styles.navSep} aria-hidden="true">|</span>
					<button className={styles.navLink} onClick={() => setMenuOpen(false)}>{t('nav.mods')}</button>
					<span className={styles.navSep} aria-hidden="true">|</span>
					<button className={styles.navLink} onClick={() => setMenuOpen(false)}>{t('nav.about')}</button>
				</nav>
				<div className={styles.utility} role="group" aria-label={t('nav.settings')}>
					<ThemeSwitcher />
					<LanguageSwitcher variant="select" />
				</div>
			</div>
			<output className={styles.statusGroup} aria-label="Connection status">
				<Tooltip content={connected ? t('status.connected') : t('status.offline')} placement="bottom">
					<div className={`${styles.pill} ${styles[serverColor]}`}>
						<PowerIcon className={styles.statusIcon} weight="bold" aria-hidden="true" />
						<span className={styles.pillLabel}>{t('status.server')}</span>
					</div>
				</Tooltip>
				<Tooltip content={gameStatus} placement="bottom">
					<div className={`${styles.pill} ${styles[gameColor]}`}>
						<PowerIcon className={styles.statusIcon} weight="bold" aria-hidden="true" />
						<span className={styles.pillLabel}>{t('status.game')}</span>
					</div>
				</Tooltip>
			</output>
		</header>
	);
}
