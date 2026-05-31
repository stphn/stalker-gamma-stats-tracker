import type { StatsBlock } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money, fmt_time } from '../../utils/formatters';
import { KillsBreakdown } from '../KillsBreakdown/KillsBreakdown';
import { StatGrid, StatGroup } from '../StatGroups/StatGroups';
import { StatRow } from '../StatRow/StatRow';
import styles from './AllTimePanel.module.css';

interface AllTimePanelProps {
	stats: StatsBlock;
}

/** Tier-3 cross-save cumulative stats for this character (data.alltime). */
export function AllTimePanel({ stats }: AllTimePanelProps) {
	const { t, locale } = useI18n();
	const net = stats.rubles_earned - stats.rubles_spent;
	const kd = stats.deaths > 0
		? (stats.kills.total / stats.deaths).toFixed(2)
		: String(stats.kills.total);

	return (
		<div className={styles.root}>
			{/* Combat — faction breakdown + donut, with Deaths/K/D beside the graphic */}
			<StatGroup label={t('pda.combat')}>
				<KillsBreakdown
					kills={stats.kills}
					label={t('kills.title')}
					donutSize={140}
					extra={
						<>
							<div className={styles.combatStat}>
								<span className={styles.combatValue} style={{ color: 'var(--color-danger)' }}>{stats.deaths}</span>
								<span className={styles.combatLabel}>{t('pda.deaths')}</span>
							</div>
							<div className={styles.combatStat}>
								<span className={styles.combatValue}>{kd}</span>
								<span className={styles.combatLabel}>{t('alltime.kd')}</span>
							</div>
						</>
					}
				/>
			</StatGroup>

			{/* Everything else — same grouped-card design as the PDA tab */}
			<StatGrid>
				<StatGroup label={t('panel.economy')}>
					<StatRow label={t('panel.earned')} value={fmt_money(stats.rubles_earned, locale)} />
					<StatRow label={t('panel.spent')} value={fmt_money(stats.rubles_spent, locale)} />
					<StatRow
						label={t('pda.net')}
						value={fmt_money(net, locale)}
						valueColor={net >= 0 ? 'var(--color-positive)' : 'var(--color-danger)'}
					/>
				</StatGroup>

				<StatGroup label={t('pda.loot')}>
					<StatRow label={t('panel.stashesFound')} value={stats.stashes} />
					<StatRow label={t('panel.itemsLooted')} value={stats.items} />
					<StatRow label={t('panel.artifacts')} value={stats.artifacts} />
				</StatGroup>

				<StatGroup label={t('alltime.progress')}>
					<StatRow label={t('panel.tasksDone')} value={stats.tasks} />
					<StatRow label={t('alltime.levelChanges')} value={stats.level_changes} />
					<StatRow label={t('pda.playtime')} value={fmt_time(stats.playtime)} />
				</StatGroup>
			</StatGrid>
		</div>
	);
}
