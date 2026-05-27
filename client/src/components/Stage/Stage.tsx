import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useLocationImage } from '../../hooks/useLocationImage';
import styles from './Stage.module.css';
import { useStageGL } from './useStageGL';

interface StageProps {
	location?: string;
	left?: ReactNode;
}

export function Stage({ location, left }: StageProps) {
	const src = useLocationImage(location);
	const containerRef = useRef<HTMLDivElement>(null);

	useStageGL(containerRef, src);

	return (
		<div
			ref={containerRef}
			className={styles.stage}
			role="img"
			aria-label={location ? `Zone location: ${location}` : 'Zone location'}
		>
			{/* WebGL canvas is injected by useStageGL at z-index 0 */}
			<div className="hud-frame" aria-hidden="true" />
			<div className={styles.scanline} aria-hidden="true" />
			<div className={styles.left}>{left}</div>
		</div>
	);
}
