import styles from './CardHeader.module.css';

interface CardHeaderProps {
	label: string;
	accentColor: string;
}

export function CardHeader({ label, accentColor }: CardHeaderProps) {
	return (
		<div className={styles.root} style={{ borderBottomColor: accentColor }}>
			<span className={styles.label}>{label}</span>
		</div>
	);
}
