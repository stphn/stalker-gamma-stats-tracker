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
			role="img"
			aria-label={location ? `Zone location: ${location}` : 'Zone location'}
			// Forward the image src as a CSS custom property so ::before/::after can use it
			style={
				src
					? ({ '--stage-img': `url(${src})` } as React.CSSProperties)
					: undefined
			}
		>
			<div className={styles.scanlines} aria-hidden="true" />
			<div className={styles.gradient} aria-hidden="true" />
			<div className={styles.left}>{left}</div>
		</div>
	);
}
