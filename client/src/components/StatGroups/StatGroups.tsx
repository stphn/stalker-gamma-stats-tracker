import type { ReactNode } from 'react';
import styles from './StatGroups.module.css';

/** 3-column responsive grid of stat group cards (shared by PDA and All-Time tabs). */
export function StatGrid({ children }: { children: ReactNode }) {
	return <div className={styles.grid}>{children}</div>;
}

/** A labelled card holding a column of StatRows. */
export function StatGroup({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className={styles.group}>
			<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {label}</span>
			<div className={styles.panel}>{children}</div>
		</div>
	);
}
