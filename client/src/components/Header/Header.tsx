import styles from './Header.module.css';

interface HeaderProps {
	connected: boolean;
	gameState: 'playing' | 'menu' | 'off';
	onMapOpen: () => void;
}

export function Header({ connected, gameState, onMapOpen }: HeaderProps) {
	const serverColor = connected ? 'green' : 'red';
	const gameColor =
		gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red';

	const serverLabel = connected ? 'Server: connected' : 'Server: disconnected';
	const gameLabel =
		gameState === 'playing'
			? 'Game: in session'
			: gameState === 'menu'
				? 'Game: in menu'
				: 'Game: not running';

	return (
		<header className={styles.header}>
			<div className="hud-frame" aria-hidden="true" />
			<div className={styles.logo}>
				<h1 className={styles.title}>T.R.A.C.K.E.R.</h1>
				<p className={styles.tagline}>A S.T.A.L.K.E.R. Anomaly Companion</p>
			</div>
			<nav className={styles.nav} aria-label="Site navigation">
				<button className={styles.navLink} onClick={onMapOpen}>Map</button>
				<span className={styles.navSep} aria-hidden="true">|</span>
				<a href="#" className={styles.navLink}>Mods</a>
				<span className={styles.navSep} aria-hidden="true">|</span>
				<a href="#" className={styles.navLink}>About</a>
			</nav>
			<output className={styles.statusGroup} aria-label="Connection status">
				<div
					className={`${styles.pill} ${styles[serverColor]}`}
					aria-label={serverLabel}
				>
					<span className={styles.dot} aria-hidden="true" />
					<span className={styles.pillLabel}>SRV</span>
					<span className={styles.pillSep} aria-hidden="true">·</span>
					<span className={styles.pillStatus}>
						{connected ? 'Connected' : 'Offline'}
					</span>
				</div>
				<div
					className={`${styles.pill} ${styles[gameColor]}`}
					aria-label={gameLabel}
				>
					<span className={styles.dot} aria-hidden="true" />
					<span className={styles.pillLabel}>GAME</span>
					<span className={styles.pillSep} aria-hidden="true">·</span>
					<span className={styles.pillStatus}>
						{gameState === 'playing' ? 'In Session' : gameState === 'menu' ? 'In Menu' : 'Offline'}
					</span>
				</div>
			</output>
		</header>
	);
}
