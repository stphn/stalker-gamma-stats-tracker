import { CoinsIcon, CompassIcon, SkullIcon } from '@phosphor-icons/react';
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
			{/* Kills */}
			<div className={styles.panel}>
				<CardHeader label={t('kills.title')} accentColor="var(--hue-red)" icon={<SkullIcon size={14} weight="fill" color="var(--hue-red)" />} />
				<KillsBreakdown kills={session.kills} label={t('kills.title')} />
			</div>

			{/* Economy + Exploration */}
			<div className={styles.bottomRow}>
				<div className={styles.panel}>
					<CardHeader label={t('panel.economy')} accentColor="var(--hue-blue)" icon={<CoinsIcon size={14} weight="bold" />} />
					<div className={styles.statRows}>
						<StatRow label={t('panel.earned')} value={fmt_money(session.rubles_earned, locale)} />
						<StatRow label={t('panel.spent')} value={fmt_money(session.rubles_spent, locale)} />
						<StatRow label={t('panel.artifacts')} value={session.artifacts} />
					</div>
				</div>
				<div className={styles.panel}>
					<CardHeader label={t('panel.exploration')} accentColor="var(--hue-green)" icon={<CompassIcon size={14} weight="bold" />} />
					<div className={styles.statRows}>
						<StatRow label={t('panel.tasksDone')} value={session.tasks} />
						<StatRow label={t('panel.stashesFound')} value={session.stashes} />
						<StatRow label={t('panel.itemsLooted')} value={session.items} />
					</div>
				</div>
			</div>
		</div>
	);
}
