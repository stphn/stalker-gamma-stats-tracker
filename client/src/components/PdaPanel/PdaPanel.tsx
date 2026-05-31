import type { GameAchievements, PdaStats } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money, fmt_time } from '../../utils/formatters';
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
			<div className={styles.grid}>
				{/* Combat */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {t('pda.combat')}</span>
					<div className={styles.panel}>
						<StatRow label={t('pda.kills')} value={n(pda.kills?.total)} />
						<StatRow label={t('pda.surrendered')} value={n(pda.enemies_surrendered)} />
					</div>
				</div>

				{/* Economy */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {t('pda.economy')}</span>
					<div className={styles.panel}>
						<StatRow label={t('pda.money')} value={fmt_money(n(pda.current_money), locale)} />
					</div>
				</div>

				{/* Zone events */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {t('pda.zone')}</span>
					<div className={styles.panel}>
						<StatRow label={t('pda.emissions')} value={n(pda.emissions)} />
						<StatRow label={t('pda.psiStorms')} value={n(pda.psi_storms)} />
						<StatRow label={t('pda.levelsVisited')} value={n(pda.levels_visited)} />
					</div>
				</div>

				{/* Deeds */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {t('pda.deeds')}</span>
					<div className={styles.panel}>
						<StatRow label={t('pda.woundedHelped')} value={n(pda.wounded_helped)} />
						<StatRow label={t('pda.fieldDressings')} value={n(pda.field_dressings)} />
						<StatRow label={t('pda.pdasDelivered')} value={n(pda.pdas_delivered)} />
						<StatRow label={t('pda.boxesSmashed')} value={n(pda.boxes_smashed)} />
					</div>
				</div>

				{/* Exploration */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {t('pda.exploration')}</span>
					<div className={styles.panel}>
						<StatRow label={t('pda.tasksCompleted')} value={n(pda.tasks)} />
						<StatRow label={t('pda.tasksFailed')} value={n(pda.tasks_failed)} />
						<StatRow label={t('pda.tasksCancelled')} value={n(pda.tasks_cancelled)} />
						<StatRow label={t('pda.stashesFound')} value={n(pda.stashes)} />
					</div>
				</div>

				{/* Knowledge */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> {t('pda.knowledge')}</span>
					<div className={styles.panel}>
						<StatRow label={t('pda.achievements')} value={achText} />
						<StatRow label={t('pda.articlesRead')} value={n(pda.articles)} />
						<StatRow label={t('pda.artifactsFound')} value={n(pda.artifacts)} />
						<StatRow label={t('pda.playtime')} value={fmt_time(pda.playtime)} />
					</div>
				</div>
			</div>
		</section>
	);
}
