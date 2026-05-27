import type { ReactNode } from 'react';
import { useLocationImage } from '../../hooks/useLocationImage';
import styles from './Stage.module.css';

interface StageProps {
	location?: string;
	left?: ReactNode;
}

export function Stage({ location, left }: StageProps) {
	const src = useLocationImage(location);

	return (
		<div
			className={styles.stage}
			style={src ? { backgroundImage: `url(${src})` } : undefined}
			role="img"
			aria-label={location ? `Zone location: ${location}` : 'Zone location'}
		>
			<div className={styles.gradient} aria-hidden="true" />
			<div className={styles.left}>{left}</div>
		</div>
	);
}
