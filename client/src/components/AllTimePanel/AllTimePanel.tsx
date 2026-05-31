import { Coins, Compass } from '@phosphor-icons/react';
import type { StatsBlock } from '../../types';
import { GameIcon } from '../GameIcon/GameIcon';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money, fmt_time } from '../../utils/formatters';
import { CardHeader } from '../CardHeader/CardHeader';
import { KillsBreakdown } from '../KillsBreakdown/KillsBreakdown';
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
			{/* Kills — full faction breakdown */}
			<div className={styles.panel}>
				<CardHeader label={t('kills.title')} accentColor="#c85a5a" icon={<GameIcon name="burningSkull" size={14} color="#c85a5a" />} />
				<KillsBreakdown kills={stats.kills} label={t('kills.title')} />
			</div>

			<div className={styles.bottomRow}>
				{/* Economy */}
				<div className={styles.panel}>
					<CardHeader label={t('panel.economy')} accentColor="#5a8ab4" icon={<Coins size={14} weight="bold" />} />
					<div className={styles.statRows}>
						<StatRow label={t('panel.earned')} value={fmt_money(stats.rubles_earned, locale)} />
						<StatRow label={t('panel.spent')} value={fmt_money(stats.rubles_spent, locale)} />
						<StatRow
							label={t('pda.net')}
							value={fmt_money(net, locale)}
							valueColor={net >= 0 ? 'var(--color-positive)' : 'var(--color-danger)'}
						/>
					</div>
				</div>

				{/* Progress */}
				<div className={styles.panel}>
					<CardHeader label={t('alltime.progress')} accentColor="#8ab45a" icon={<Compass size={14} weight="bold" />} />
					<div className={styles.statRows}>
						<StatRow label={t('pda.deaths')} value={stats.deaths} />
						<StatRow label={t('alltime.kd')} value={kd} />
						<StatRow label={t('panel.tasksDone')} value={stats.tasks} />
						<StatRow label={t('panel.stashesFound')} value={stats.stashes} />
						<StatRow label={t('panel.itemsLooted')} value={stats.items} />
						<StatRow label={t('panel.artifacts')} value={stats.artifacts} />
						<StatRow label={t('alltime.levelChanges')} value={stats.level_changes} />
						<StatRow label={t('pda.playtime')} value={fmt_time(stats.playtime)} />
					</div>
				</div>
			</div>
		</div>
	);
}
