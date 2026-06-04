import type { StatsData } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money } from '../../utils/formatters';
import { CardHeader } from '../CardHeader/CardHeader';
import { KillsBreakdown } from '../KillsBreakdown/KillsBreakdown';
import { StatRow } from '../StatRow/StatRow';
import styles from './RightPanel.module.css';

interface RightPanelProps {
	data: StatsData;
}

export function RightPanel({ data }: RightPanelProps) {
	const { t, locale } = useI18n();
	const { session } = data;

	return (
		<div className={styles.root}>
			{/* Session stats — the glass container is scoped to just these cards. */}
			<div className={styles.stats}>
				{/* Kills */}
				<div className={styles.panel}>
					<CardHeader label={t('kills.title')} accentColor="var(--hue-red)" />
					<KillsBreakdown kills={session.kills} label={t('kills.title')} donutSize={120} />
				</div>

				{/* Economy + Exploration */}
				<div className={styles.bottomRow}>
					<div className={styles.panel}>
						<CardHeader label={t('panel.economy')} accentColor="var(--hue-blue)" />
						<div className={styles.statRows}>
							<StatRow label={t('panel.earned')} value={fmt_money(session.rubles_earned, locale)} />
							<StatRow label={t('panel.spent')} value={fmt_money(session.rubles_spent, locale)} />
							<StatRow label={t('panel.artifacts')} value={session.artifacts} />
						</div>
					</div>
					<div className={styles.panel}>
						<CardHeader label={t('panel.exploration')} accentColor="var(--hue-green)" />
						<div className={styles.statRows}>
							<StatRow label={t('panel.tasksDone')} value={session.tasks} />
							<StatRow label={t('panel.stashesFound')} value={session.stashes} />
							<StatRow label={t('panel.itemsLooted')} value={session.items} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
