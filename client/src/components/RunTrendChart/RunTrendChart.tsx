import { useMemo } from 'react';
import type { Run } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money } from '../../utils/formatters';
import styles from './RunTrendChart.module.css';

interface RunTrendChartProps {
	/** Full career run history (newest-first, as useRuns returns it). */
	runs: Run[];
}

// Fixed coordinate space; the SVG scales uniformly to the container via CSS.
const W = 600;
const H = 160;
const PAD_T = 12;
const PAD_B = 12;

/**
 * Career earnings trend: per-run income as bars + a cumulative wealth line.
 * Hand-built SVG (no chart lib), matching the KillsDonut approach. The runs
 * table has `rubles_earned` per run but not `rubles_spent`, so this is gross
 * income over time, not net — net stays a summary figure from the alltime block.
 */
export function RunTrendChart({ runs }: RunTrendChartProps) {
	const { t, locale } = useI18n();

	const model = useMemo(() => {
		// Oldest → newest so the timeline reads left-to-right.
		const ordered = [...runs].sort((a, b) => a.start - b.start);
		const earned = ordered.map((r) => r.rubles_earned ?? 0);
		if (earned.length === 0) return null;

		const maxEarned = Math.max(1, ...earned);
		let running = 0;
		const cumulative = earned.map((e) => (running += e));
		const maxCum = Math.max(1, running);

		const plotH = H - PAD_T - PAD_B;
		const step = W / earned.length;
		const barW = Math.max(1, step * 0.7);

		const bars = earned.map((e, i) => {
			const h = (e / maxEarned) * plotH;
			return { x: i * step + (step - barW) / 2, y: H - PAD_B - h, h };
		});

		const linePts = cumulative
			.map((c, i) => {
				const x = i * step + step / 2;
				const y = H - PAD_B - (c / maxCum) * plotH;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');

		return { bars, barW, linePts, total: running };
	}, [runs]);

	if (!model) return null;

	return (
		<div className={styles.root}>
			<div className={styles.head}>
				<span className={styles.title}>⠿ {t('alltime.earningsTrend')}</span>
				<span className={styles.legend}>
					<span className={styles.legendBar} /> {t('alltime.perRun')}
					<span className={styles.legendLine} /> {t('alltime.cumulative')}
					<span className={styles.total}>{fmt_money(model.total, locale)}</span>
				</span>
			</div>
			<svg
				className={styles.svg}
				viewBox={`0 0 ${W} ${H}`}
				preserveAspectRatio="none"
				role="img"
				aria-label={t('alltime.earningsTrend')}
			>
				{model.bars.map((b, i) => (
					<rect
						key={i}
						x={b.x}
						y={b.y}
						width={model.barW}
						height={b.h}
						className={styles.bar}
					/>
				))}
				<polyline
					points={model.linePts}
					className={styles.line}
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		</div>
	);
}
