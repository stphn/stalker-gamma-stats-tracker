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
		>
			{/* SVG filter definitions */}
			<svg
				width="0"
				height="0"
				aria-hidden="true"
				className={styles.filterDefs}
			>
				<defs>
					<filter
						id="glitch"
						x="0%"
						y="0%"
						width="100%"
						height="100%"
						color-interpolation-filters="sRGB"
					>
						{/* Chromatic aberration — split R channel left, B channel right */}
						<feColorMatrix
							type="matrix"
							values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
							result="red"
						/>
						<feOffset in="red" dx="-3" dy="0" result="redShift" />
						<feColorMatrix
							in="SourceGraphic"
							type="matrix"
							values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
							result="green"
						/>
						<feColorMatrix
							in="SourceGraphic"
							type="matrix"
							values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
							result="blue"
						/>
						<feOffset in="blue" dx="3" dy="0" result="blueShift" />
						{/* Merge channels back */}
						<feBlend in="redShift" in2="green" mode="screen" result="rg" />
						<feBlend in="rg" in2="blueShift" mode="screen" result="rgb" />
						{/* Slight desaturate for Zone atmosphere */}
						<feColorMatrix in="rgb" type="saturate" values="0.72" />
					</filter>
				</defs>
			</svg>

			{src && (
				<div
					className={styles.image}
					style={{ backgroundImage: `url(${src})` }}
					aria-hidden="true"
				/>
			)}
			<div className={styles.scanlines} aria-hidden="true" />
			<div className={styles.gradient} aria-hidden="true" />
			<div className={styles.left}>{left}</div>
		</div>
	);
}
