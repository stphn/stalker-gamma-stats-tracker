import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react';
import { useI18n } from '../../i18n/I18nContext';
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
	const { t } = useI18n();
	const src = useLocationImage(location, night);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useStageGL(containerRef, src);

	useEffect(() => {
		const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	}, []);

	const toggleFullscreen = () => {
		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		} else {
			containerRef.current?.requestFullscreen().catch(() => {});
		}
	};

	return (
		<div
			ref={containerRef}
			className={styles.stage}
			role="img"
			aria-label={location ? `Zone location: ${location}` : 'Zone location'}
		>
			{/* WebGL canvas is injected by useStageGL at z-index 0 */}
			<div className="hud-frame" aria-hidden="true" />
			<button
				type="button"
				className={styles.fullscreenBtn}
				onClick={toggleFullscreen}
				aria-label={isFullscreen ? t('stage.exitFullscreen') : t('stage.fullscreen')}
			>
				{isFullscreen ? (
					<ArrowsInIcon className={styles.fullscreenIcon} weight="bold" aria-hidden="true" />
				) : (
					<ArrowsOutIcon className={styles.fullscreenIcon} weight="bold" aria-hidden="true" />
				)}
			</button>
			<div className={styles.vhs} aria-hidden="true">
				<span className={styles.vhsBar} />
			</div>
			{/* Corner overlay: actors (with kills) bottom-left, compass bottom-right. */}
			<div className={styles.content}>
				<div className={styles.bottomLeft}>{left}</div>
				{compass && <div className={styles.compass}>{compass}</div>}
			</div>
			{overlay && <div className={styles.overlay}>{overlay}</div>}
			{death && <div className={styles.death}>{death}</div>}
		</div>
	);
}
