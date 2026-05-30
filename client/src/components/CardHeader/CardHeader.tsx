import type { ReactNode } from 'react';
import styles from './CardHeader.module.css';

interface CardHeaderProps {
	label: string;
	accentColor: string;
	icon?: ReactNode;
}

export function CardHeader({ label, accentColor, icon }: CardHeaderProps) {
	return (
		<div className={styles.root} style={{ borderTopColor: accentColor }}>
			{icon && <span className={styles.icon} style={{ color: accentColor }}>{icon}</span>}
			<span className={styles.label}>{label}</span>
		</div>
	);
}
