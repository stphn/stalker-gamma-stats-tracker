import type { Kills } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { KillsBreakdown } from '../KillsBreakdown/KillsBreakdown';
import styles from './KillsCard.module.css';

interface KillsCardProps {
	kills: Kills;
}

/** Live HUD kills card — type rows + donut, on the Stage's center-bottom cell.
   Header matches the actor/squad cards: a plain label above a glass card. */
export function KillsCard({ kills }: KillsCardProps) {
	const { t } = useI18n();

	return (
		<section className={styles.root} aria-label={t('kills.title')}>
			<div className={styles.label} aria-hidden="true">
				{t('kills.title')}
			</div>
			<div className={styles.card}>
				<KillsBreakdown kills={kills} label={t('kills.title')} donutSize={96} compact />
			</div>
		</section>
	);
}
