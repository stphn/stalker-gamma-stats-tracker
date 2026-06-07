import { useMemo } from 'react';
import type { Run } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money, fmt_time } from '../../utils/formatters';
import { StatGrid, StatGroup } from '../StatGroups/StatGroups';
import { StatRow } from '../StatRow/StatRow';

interface RecordsProps {
	/** Full career run history (one row per death). */
	runs: Run[];
}

function num(v: number | null | undefined): number {
	return v ?? 0;
}

/**
 * Career bests + per-run averages, computed over the whole run history. Only
 * meaningful on the All-Time tab — these summarise many lives, which PDA can't.
 */
export function Records({ runs }: RecordsProps) {
	const { t, locale } = useI18n();

	const stats = useMemo(() => {
		if (runs.length === 0) return null;
		let maxKills = 0;
		let maxPlaytime = 0;
		let maxEarned = 0;
		let sumKills = 0;
		let sumPlaytime = 0;
		let sumEarned = 0;
		for (const r of runs) {
			const kills = num(r.kills?.total);
			const playtime = num(r.playtime);
			const earned = num(r.rubles_earned);
			if (kills > maxKills) maxKills = kills;
			if (playtime > maxPlaytime) maxPlaytime = playtime;
			if (earned > maxEarned) maxEarned = earned;
			sumKills += kills;
			sumPlaytime += playtime;
			sumEarned += earned;
		}
		const n = runs.length;
		return {
			maxKills,
			maxPlaytime,
			maxEarned,
			avgKills: Math.round(sumKills / n),
			avgPlaytime: Math.round(sumPlaytime / n),
			avgEarned: Math.round(sumEarned / n),
		};
	}, [runs]);

	if (!stats) return null;

	return (
		<StatGrid>
			<StatGroup label={t('alltime.records')}>
				<StatRow label={t('alltime.deadliestRun')} value={stats.maxKills} />
				<StatRow label={t('alltime.longestSurvival')} value={fmt_time(stats.maxPlaytime)} />
				<StatRow label={t('alltime.richestHaul')} value={fmt_money(stats.maxEarned, locale)} />
			</StatGroup>

			<StatGroup label={t('alltime.perRunAvg')}>
				<StatRow label={t('alltime.avgKills')} value={stats.avgKills} />
				<StatRow label={t('alltime.avgSurvival')} value={fmt_time(stats.avgPlaytime)} />
				<StatRow label={t('alltime.avgEarned')} value={fmt_money(stats.avgEarned, locale)} />
			</StatGroup>
		</StatGrid>
	);
}
