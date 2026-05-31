import type { GameAchievements, PdaStats } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money } from '../../utils/formatters';
import { StatGrid, StatGroup } from '../StatGroups/StatGroups';
import { StatRow } from '../StatRow/StatRow';
import styles from './PdaPanel.module.css';

interface PdaPanelProps {
	pda: PdaStats;
	achievements?: GameAchievements;
}

// Guard against fields the mod hasn't written yet
function n(v: number | undefined): number {
	return v ?? 0;
}

export function PdaPanel({ pda, achievements }: PdaPanelProps) {
	const { t, locale } = useI18n();
	const achText = achievements
		? `${achievements.earned}/${achievements.total}`
		: n(pda.achievements_count);

	return (
		<section className={styles.root}>
			<StatGrid>
				<StatGroup label={t('pda.combat')}>
					<StatRow label={t('pda.mutants')} value={n(pda.kills?.mutant)} />
					<StatRow label={t('pda.stalkers')} value={n(pda.kills?.stalker)} />
					<StatRow label={t('pda.helicopters')} value={n(pda.kills?.helicopter)} />
					<StatRow label={t('pda.surrendered')} value={n(pda.enemies_surrendered)} />
				</StatGroup>

				<StatGroup label={t('pda.survival')}>
					<StatRow label={t('pda.emissions')} value={n(pda.emissions)} />
					<StatRow label={t('pda.psiStorms')} value={n(pda.psi_storms)} />
					<StatRow label={t('pda.fieldDressings')} value={n(pda.field_dressings)} />
					<StatRow label={t('pda.woundedHelped')} value={n(pda.wounded_helped)} />
				</StatGroup>

				<StatGroup label={t('pda.loot')}>
					<StatRow label={t('pda.money')} value={fmt_money(n(pda.current_money), locale)} />
					<StatRow label={t('pda.stashesFound')} value={n(pda.stashes)} />
					<StatRow label={t('pda.artifactsFound')} value={n(pda.artifacts)} />
					<StatRow label={t('pda.boxesSmashed')} value={n(pda.boxes_smashed)} />
				</StatGroup>

				<StatGroup label={t('pda.tasks')}>
					<StatRow label={t('pda.tasksCompleted')} value={n(pda.tasks)} />
					<StatRow label={t('pda.tasksFailed')} value={n(pda.tasks_failed)} />
					<StatRow label={t('pda.tasksCancelled')} value={n(pda.tasks_cancelled)} />
				</StatGroup>

				<StatGroup label={t('pda.exploration')}>
					<StatRow label={t('pda.timeInZone')} value={`${n(pda.game_days)}d`} />
					<StatRow label={t('alltime.levelChanges')} value={n(pda.level_changes)} />
					<StatRow label={t('pda.levelsVisited')} value={n(pda.levels_visited)} />
				</StatGroup>

				<StatGroup label={t('pda.progress')}>
					<StatRow label={t('pda.achievements')} value={achText} />
					<StatRow label={t('pda.articlesRead')} value={n(pda.articles)} />
					<StatRow label={t('pda.pdasDelivered')} value={n(pda.pdas_delivered)} />
				</StatGroup>
			</StatGrid>
		</section>
	);
}
