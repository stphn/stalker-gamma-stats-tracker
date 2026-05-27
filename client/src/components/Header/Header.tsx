import styles from './Header.module.css';

interface HeaderProps {
	connected: boolean;
	gameState: 'playing' | 'menu' | 'off';
}

export function Header({ connected, gameState }: HeaderProps) {
	const serverColor = connected ? 'green' : 'red';
	const gameColor =
		gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red';

	return (
		<header className={styles.header}>
			<div className={styles.logo}>
				<h1 className={styles.title}>T.R.A.C.K.E.R.</h1>
				<div className={styles.tagline}>A S.T.A.L.K.E.R. Anomaly Companion</div>
			</div>
			<div className={styles.statusGroup}>
				<span className={styles.statusSuperLabel}>Status</span>
				<div className={styles.statusItem}>
					<span className={`${styles.dot} ${styles[serverColor]}`} />
					<span className={`${styles.statusLabel} ${styles[serverColor]}`}>
						Server
					</span>
				</div>
				<div className={styles.statusItem}>
					<span className={`${styles.dot} ${styles[gameColor]}`} />
					<span className={`${styles.statusLabel} ${styles[gameColor]}`}>
						Game
					</span>
				</div>
			</div>
		</header>
	);
}
