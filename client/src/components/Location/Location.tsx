import { useI18n } from '../../i18n/I18nContext';
import { fmt_location } from '../../utils/formatters';
import styles from './Location.module.css';

interface LocationProps {
	location: string;
	locationName?: string;
	gameTime?: { h: number; m: number };
	gameState: 'playing' | 'menu' | 'off';
}

const BADGES = {
	playing: { key: 'location.live', className: 'badgeLive' },
	menu: { key: 'location.inMenu', className: 'badgeMenu' },
	off: { key: 'location.off', className: 'badgeOff' },
};

export function Location({
	location,
	locationName,
	gameTime,
	gameState,
}: LocationProps) {
	const { t } = useI18n();
	const levelKey = `level.${location}`;
	const name = t(levelKey) !== levelKey ? t(levelKey) : fmt_location(location, locationName);
	const clock =
		gameTime != null
			? `${String(gameTime.h).padStart(2, '0')}:${String(gameTime.m).padStart(2, '0')}`
			: null;
	const badge = BADGES[gameState];
	const badgeLabel = t(badge.key);

	return (
		<div className={styles.root}>
			<div className={styles.name} aria-label={`Current location: ${name}`}>
				{name}
			</div>
			{clock && (
				<div className={styles.timeRow}>
					<time className={styles.clock} aria-label={`In-game time: ${clock}`}>
						{clock}
					</time>
					<span
						className={`${styles.badge} ${styles[badge.className]}`}
						aria-label={badgeLabel}
					>
						{badgeLabel}
					</span>
				</div>
			)}
		</div>
	);
}
