import { useState } from 'react';
import type { Run, StatsData } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { AllTimePanel } from '../AllTimePanel/AllTimePanel';
import { PdaPanel } from '../PdaPanel/PdaPanel';
import styles from './StatsTabs.module.css';

type Tab = 'pda' | 'alltime';

interface StatsTabsProps {
	data: StatsData;
	/** Full career run history — powers the All-Time Career band, records and trend. */
	runs: Run[];
	/** Authoritative all-time run count (not just the loaded rows). */
	totalRuns: number;
}

/** Tabbed stats: PDA (native game stats) and All-Time (our cross-save cumulative). */
export function StatsTabs({ data, runs, totalRuns }: StatsTabsProps) {
	const { t } = useI18n();
	const hasPda = !!data.alltime_official;
	const [tab, setTab] = useState<Tab>(hasPda ? 'pda' : 'alltime');

	// Fall back to All-Time if PDA data is unavailable
	const active: Tab = tab === 'pda' && !hasPda ? 'alltime' : tab;

	return (
		<section className={styles.root}>
			<div className={styles.head}>
				<span className={styles.heading}>{t('stats.heading')}</span>
				<div className={styles.tabBar} role="tablist" aria-label={t('tab.ariaLabel')}>
					{hasPda && (
					<button
						type="button"
						role="tab"
						id="tab-pda"
						aria-controls="panel-stats"
						aria-selected={active === 'pda'}
						className={`${styles.tab} ${active === 'pda' ? styles.tabActive : ''}`}
						onClick={() => setTab('pda')}
					>
						{t('tab.pda')}
					</button>
				)}
				<button
					type="button"
					role="tab"
					id="tab-alltime"
					aria-controls="panel-stats"
					aria-selected={active === 'alltime'}
					className={`${styles.tab} ${active === 'alltime' ? styles.tabActive : ''}`}
					onClick={() => setTab('alltime')}
				>
					{t('tab.alltime')}
				</button>
				</div>
			</div>

			<div role="tabpanel" id="panel-stats" aria-labelledby={`tab-${active}`} tabIndex={0}>
				{active === 'pda' && data.alltime_official ? (
					<PdaPanel pda={data.alltime_official} achievements={data.game_achievements} />
				) : (
					<AllTimePanel stats={data.alltime} runs={runs} totalRuns={totalRuns} />
				)}
			</div>
		</section>
	);
}
