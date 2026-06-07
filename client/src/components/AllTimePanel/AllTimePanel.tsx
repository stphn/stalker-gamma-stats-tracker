import type { AllTimeBlock, Run } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money } from '../../utils/formatters';
import { CareerBand } from '../CareerBand/CareerBand';
import { KillsBreakdown } from '../KillsBreakdown/KillsBreakdown';
import { Records } from '../Records/Records';
import { RunTrendChart } from '../RunTrendChart/RunTrendChart';
import { StatGrid, StatGroup } from '../StatGroups/StatGroups';
import { StatRow } from '../StatRow/StatRow';
import styles from './AllTimePanel.module.css';

interface AllTimePanelProps {
	stats: AllTimeBlock;
	/** Full career run history — powers the Career band, records and trend. */
	runs: Run[];
	/** Authoritative all-time run count. */
	totalRuns: number;
}

// Guard against richer fields a pre-update mod build hasn't written yet.
function n(v: number | undefined): number {
	return v ?? 0;
}

/**
 * Tier-3 cross-save cumulative stats for the whole install (data.alltime). Unlike
 * the PDA tab (one character), this owns the run/death axis: a Career band, the
 * faction donut, PDA-mirrored categories carried cross-save, an earnings trend
 * and career records.
 */
export function AllTimePanel({ stats, runs, totalRuns }: AllTimePanelProps) {
	const { t, locale } = useI18n();
	const net = stats.rubles_earned - stats.rubles_spent;
	const kd = stats.deaths > 0
		? (stats.kills.total / stats.deaths).toFixed(2)
		: String(stats.kills.total);

	return (
		<div className={styles.root}>
			{/* Career band — the hero numbers only the cross-save tier can own. */}
			<CareerBand
				totalRuns={totalRuns}
				deaths={stats.deaths}
				kd={kd}
				playtime={stats.playtime}
				distanceM={stats.distance_m}
				zoneDays={stats.zone_days}
			/>

			{/* Combat — faction rows split into two columns + donut, as three equal
			    cards that line up with the Survival/Economy/Loot grid below. */}
			<div className={styles.combat}>
				<span className={styles.combatLabel}>
					<span aria-hidden="true">⠿</span> {t('pda.combat')}
				</span>
				<KillsBreakdown kills={stats.kills} label={t('kills.title')} donutSize={140} splitRows />
			</div>

			{/* PDA-mirrored categories, every figure summed across the whole career. */}
			<StatGrid>
				<StatGroup label={t('pda.survival')}>
					<StatRow label={t('pda.emissions')} value={n(stats.emissions)} />
					<StatRow label={t('pda.psiStorms')} value={n(stats.psi_storms)} />
					<StatRow label={t('pda.fieldDressings')} value={n(stats.field_dressings)} />
					<StatRow label={t('pda.woundedHelped')} value={n(stats.wounded_helped)} />
				</StatGroup>

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
					<StatRow label={t('pda.boxesSmashed')} value={n(stats.boxes_smashed)} />
				</StatGroup>

				<StatGroup label={t('pda.tasks')}>
					<StatRow label={t('panel.tasksDone')} value={stats.tasks} />
					<StatRow label={t('pda.tasksFailed')} value={n(stats.tasks_failed)} />
					<StatRow label={t('pda.tasksCancelled')} value={n(stats.tasks_cancelled)} />
				</StatGroup>

				<StatGroup label={t('pda.exploration')}>
					<StatRow label={t('alltime.levelChanges')} value={stats.level_changes} />
					<StatRow label={t('pda.levelsVisited')} value={n(stats.levels_visited)} />
					<StatRow label={t('alltime.zoneDays')} value={n(stats.zone_days)} />
				</StatGroup>

				<StatGroup label={t('alltime.progress')}>
					<StatRow label={t('pda.surrendered')} value={n(stats.enemies_surrendered)} />
					<StatRow label={t('pda.pdasDelivered')} value={n(stats.pdas_delivered)} />
					<StatRow label={t('pda.articlesRead')} value={n(stats.articles)} />
				</StatGroup>
			</StatGrid>

			{/* Earnings over the career + career bests — both need the full run history. */}
			{runs.length > 0 && (
				<>
					<RunTrendChart runs={runs} />
					<Records runs={runs} />
				</>
			)}
		</div>
	);
}
