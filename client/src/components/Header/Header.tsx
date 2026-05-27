import styles from './Header.module.css';

interface HeaderProps {
	connected: boolean;
	gameState: 'playing' | 'menu' | 'off';
}

export function Header({ connected, gameState }: HeaderProps) {
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
			<div className={styles.logo}>
				<h1 className={styles.title}>T.R.A.C.K.E.R.</h1>
				<p className={styles.tagline}>A S.T.A.L.K.E.R. Anomaly Companion</p>
			</div>
			<output className={styles.statusGroup} aria-label="Connection status">
				<span className={styles.statusSuperLabel} aria-hidden="true">
					Status
				</span>
				<div className={styles.statusItem}>
					<span
						className={`${styles.dot} ${styles[serverColor]}`}
						aria-hidden="true"
					/>
					<span
						className={`${styles.statusLabel} ${styles[serverColor]}`}
						aria-label={serverLabel}
					>
						Server
					</span>
				</div>
				<div className={styles.statusItem}>
					<span
						className={`${styles.dot} ${styles[gameColor]}`}
						aria-hidden="true"
					/>
					<span
						className={`${styles.statusLabel} ${styles[gameColor]}`}
						aria-label={gameLabel}
					>
						Game
					</span>
				</div>
			</output>
		</header>
	);
}
