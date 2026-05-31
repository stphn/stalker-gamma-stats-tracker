import { Skull } from '@phosphor-icons/react';
import { useI18n } from '../../i18n/I18nContext';
import type { Run } from '../../types';
import { fmt_time } from '../../utils/formatters';
import styles from './DeathOverlay.module.css';

interface Props {
	run: Run | null;
}

export function DeathOverlay({ run }: Props) {
	const { t } = useI18n();

	const zone =
		run?.death_location_name ??
		(run?.death_location
			? t(`level.${run.death_location}`) !== `level.${run.death_location}`
				? t(`level.${run.death_location}`)
				: run.death_location
			: null);

	return (
		<div className={styles.root} role="alert" aria-label={t('death.title')}>
			<div className={styles.scrim} aria-hidden="true" />
			<div className={styles.card}>
				<Skull className={styles.skull} weight="fill" aria-hidden="true" />
				<h2 className={styles.title}>{t('death.title')}</h2>

				{run && (
					<div className={styles.summary}>
						{zone && <span className={styles.zone}>{zone}</span>}
						<span className={styles.stats}>
							{fmt_time(run.playtime ?? 0)}
							<span className={styles.dot}>·</span>
							{run.kills?.total ?? 0} {t('deathlog.kills')}
							<span className={styles.dot}>·</span>
							{run.artifacts ?? 0} {t('deathlog.artifacts')}
						</span>
					</div>
				)}

				<p className={styles.flavor}>{t('death.flavor')}</p>
			</div>
		</div>
	);
}
