import { useI18n } from '../../i18n/I18nContext';
import { fmt_distance, fmt_time } from '../../utils/formatters';
import styles from './CareerBand.module.css';

interface Cell {
	value: string | number;
	label: string;
	/** Optional accent colour for the value (theme token). */
	color?: string;
}

interface CareerBandProps {
	totalRuns: number;
	deaths: number;
	kd: string;
	playtime: number;
	distanceM?: number;
	zoneDays?: number;
}

/**
 * The hero band that leads the All-Time tab — the numbers only the cross-save
 * tier can own (run/death axis, lifetime playtime & distance). PDA can't show
 * these because it only knows the current character.
 */
export function CareerBand({ totalRuns, deaths, kd, playtime, distanceM, zoneDays }: CareerBandProps) {
	const { t, locale } = useI18n();

	const cells: Cell[] = [
		{ value: totalRuns, label: t('alltime.runs') },
		{ value: deaths, label: t('pda.deaths'), color: 'var(--color-danger)' },
		{ value: kd, label: t('alltime.kd') },
		{ value: fmt_time(playtime), label: t('pda.playtime') },
		{ value: fmt_distance(distanceM, locale), label: t('alltime.distance') },
		{ value: zoneDays ?? 0, label: t('alltime.zoneDays') },
	];

	return (
		<div className={styles.band} role="group" aria-label={t('alltime.career')}>
			{cells.map((c) => (
				<div key={c.label} className={styles.cell}>
					<span className={styles.value} style={c.color ? { color: c.color } : undefined}>
						{c.value}
					</span>
					<span className={styles.label}>{c.label}</span>
				</div>
			))}
		</div>
	);
}
