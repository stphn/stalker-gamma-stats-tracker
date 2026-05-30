import type { StatsData } from '../../types';
import styles from './DebugPanel.module.css';

interface DebugPanelProps {
	data: StatsData | null;
	connected: boolean;
	gameState: 'playing' | 'menu' | 'off';
	stale: boolean;
	onTestDeath: () => void;
	onClose: () => void;
}

export function DebugPanel({
	data, connected, gameState, stale, onTestDeath, onClose,
}: DebugPanelProps) {
	const a = data?.actor;
	const age = data?.last_updated ? Math.round(Date.now() / 1000 - data.last_updated) : null;

	const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
		<div className={styles.row}><span className={styles.k}>{k}</span><span className={styles.v}>{v}</span></div>
	);

	return (
		<div className={styles.panel}>
			<div className={styles.head}>
				<span>◈ DEBUG</span>
				<button className={styles.close} onClick={onClose} aria-label="Close debug (D)">✕</button>
			</div>

			<div className={styles.section}>
				<div className={styles.title}>Connection</div>
				<Row k="server" v={connected ? 'connected' : 'offline'} />
				<Row k="game" v={gameState} />
				<Row k="data age" v={age != null ? `${age}s` : '—'} />
				<Row k="stale" v={stale ? 'yes' : 'no'} />
			</div>

			<div className={styles.section}>
				<div className={styles.title}>Actor</div>
				<Row k="name" v={a?.name ?? '—'} />
				<Row k="level" v={a?.location ?? '—'} />
				<Row k="X / Z" v={a?.pos_x != null ? `${a.pos_x.toFixed(1)} / ${a.pos_z?.toFixed(1)}` : '—'} />
				<Row k="heading" v={a?.heading != null ? `${a.heading.toFixed(1)}°` : '—'} />
				<Row k="money" v={a?.money?.toLocaleString() ?? '—'} />
			</div>

			<div className={styles.section}>
				<div className={styles.title}>Session</div>
				<Row k="kills" v={data?.session?.kills?.total ?? '—'} />
				<Row k="deaths" v={data?.session?.deaths ?? '—'} />
				<Row k="playtime" v={data?.session?.playtime != null ? `${Math.floor(data.session.playtime / 60)}m` : '—'} />
			</div>

			<div className={styles.section}>
				<div className={styles.title}>Actions</div>
				<button className={`${styles.btn} ${styles.danger}`} onClick={onTestDeath}>
					💀 test death
				</button>
			</div>

			<div className={styles.hint}>press D to toggle</div>
		</div>
	);
}
