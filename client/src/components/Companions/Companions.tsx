import type { Companion } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { hp_color, rank_label, rep_color, rep_label } from '../../utils/formatters';
import { FactionIcon } from '../FactionIcon/FactionIcon';
import styles from './Companions.module.css';

interface CompanionsProps {
	companions: Companion[];
}

export function Companions({ companions }: CompanionsProps) {
	const { t } = useI18n();
	return (
		<section className={styles.root} aria-label="Squad companions">
			<div className={styles.label} aria-hidden="true">
				{t('companions.squad')}
			</div>
			<ul className={styles.grid}>
				{companions.map((c) => {
					const hpColor = hp_color(c.health);
					return (
						<li key={c.name} className={styles.card}>
							<div className={styles.nameRow}>
								<FactionIcon faction={c.faction} size="xs" />
								<span className={styles.name}>{c.name}</span>
							</div>
							<div className={styles.meta}>
								<span className={styles.rank}>{t(rank_label(c.rank))}</span>
								{c.reputation != null && (
									<span className={styles.rep} style={{ color: rep_color(c.reputation) }}>
										{t(rep_label(c.reputation))}
									</span>
								)}
							</div>
							<div className={styles.hpRow}>
								<div
									className={styles.hpTrack}
									role="meter"
									aria-label={`${c.name} health`}
									aria-valuenow={c.health}
									aria-valuemin={0}
									aria-valuemax={100}
								>
									<div
										className={styles.hpFill}
										style={{ width: `${c.health}%`, background: hpColor }}
									/>
								</div>
								<span className={styles.hpValue} style={{ color: hpColor }}>
									{c.health}%
								</span>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
