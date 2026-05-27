import type { ReactNode } from 'react';
import { useLocationMedia } from '../../hooks/useLocationMedia';
import styles from './Stage.module.css';

interface StageProps {
	location?: string;
	left?: ReactNode;
}

export function Stage({ location, left }: StageProps) {
	const media = useLocationMedia(location);

	return (
		<div
			className={styles.stage}
			style={
				media?.type === 'image'
					? { backgroundImage: `url(${media.src})` }
					: undefined
			}
			role="img"
			aria-label={location ? `Zone location: ${location}` : 'Zone location'}
		>
			{media?.type === 'video' && (
				<video
					className={styles.video}
					src={media.src}
					autoPlay
					loop
					muted
					playsInline
					tabIndex={-1}
					aria-hidden="true"
				/>
			)}
			<div className={styles.gradient} aria-hidden="true" />
			<div className={styles.left}>{left}</div>
		</div>
	);
}
