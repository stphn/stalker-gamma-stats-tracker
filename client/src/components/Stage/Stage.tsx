import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useLocationImage } from '../../hooks/useLocationImage';
import styles from './Stage.module.css';
import { useStageGL } from './useStageGL';

interface StageProps {
	location?: string;
	night?: boolean;
	left?: ReactNode;
	compass?: ReactNode;
	overlay?: ReactNode;
	death?: ReactNode;
}

export function Stage({ location, night, left, compass, overlay, death }: StageProps) {
	const src = useLocationImage(location, night);
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
			<div className={styles.vhs} aria-hidden="true">
				<span className={styles.vhsBar} />
			</div>
			{/* Corner overlay: grid places content bottom-left, compass bottom-right. */}
			<div className={styles.content}>
				<div className={styles.bottomLeft}>{left}</div>
				{compass && <div className={styles.compass}>{compass}</div>}
			</div>
			{overlay && <div className={styles.overlay}>{overlay}</div>}
			{death && <div className={styles.death}>{death}</div>}
		</div>
	);
}
