import type { ReactNode } from 'react';
import type { Kills } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import {
	FACTION_BG_COLORS,
	FACTION_COLORS,
	FACTION_ICONS,
} from '../../utils/constants';
import { FactionIcon } from '../FactionIcon/FactionIcon';
import { StatRow } from '../StatRow/StatRow';
import styles from './KillsBreakdown.module.css';

// Faction kills use FactionIcon (insignia + bg). Non-faction kill categories use a plain icon.
const KILL_DEFS: {
	labelKey: string;
	key: keyof Kills;
	icon?: string;
}[] = [
	{ labelKey: 'kills.loners', key: 'stalker' },
	{ labelKey: 'kills.bandits', key: 'bandit' },
	{ labelKey: 'kills.military', key: 'military' },
	{ labelKey: 'kills.freedom', key: 'freedom' },
	{ labelKey: 'kills.duty', key: 'duty' },
	{ labelKey: 'kills.ecologists', key: 'ecolog' },
	{ labelKey: 'kills.clearSky', key: 'csky' },
	{ labelKey: 'kills.monolith', key: 'monolith' },
	{ labelKey: 'kills.mercs', key: 'killer' },
	{ labelKey: 'kills.renegades', key: 'renegade' },
	{ labelKey: 'kills.mutants', key: 'mutant', icon: '/factions/faction_mutant.webp' },
	{ labelKey: 'kills.helis', key: 'helicopter' },
	{ labelKey: 'kills.other', key: 'other' },
];

interface DonutProps {
	segments: { color: string; count: number }[];
	total: number;
	label: string;
	size?: number;
	thickness?: number;
}

function KillsDonut({
	segments,
	total,
	label,
	size = 96,
	thickness = 14,
}: DonutProps) {
	const r = (size - thickness) / 2;
	const C = 2 * Math.PI * r;
	let accumulated = 0;

	const arcs = segments
		.filter((s) => s.count > 0)
		.map((s) => {
			const fraction = s.count / total;
			const dashLen = Math.max(0, fraction * C - 1.5);
			const offset = -accumulated * C;
			accumulated += fraction;
			return { color: s.color, dashLen, offset };
		});

	return (
		<div className={styles.donutWrap}>
			<svg
				width={size}
				height={size}
				style={{ transform: 'rotate(-90deg)' }}
				aria-hidden="true"
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="#2a2a2a"
					strokeWidth={thickness}
				/>
				{arcs.map((arc) => (
					<circle
						key={arc.color}
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill="none"
						stroke={arc.color}
						strokeWidth={thickness}
						strokeDasharray={`${arc.dashLen} ${C}`}
						strokeDashoffset={arc.offset}
						strokeLinecap="butt"
					/>
				))}
			</svg>
			<div className={styles.donutCenter}>
				<span className={styles.donutCount}>{total}</span>
				<span className={styles.donutLabel}>{label}</span>
			</div>
		</div>
	);
}

interface KillsBreakdownProps {
	kills: Kills;
	label: string;
	/** Optional extra column rendered right of the donut (e.g. Deaths + K/D). */
	extra?: ReactNode;
	/** Donut diameter in px (default 96). Larger when there's an extra column. */
	donutSize?: number;
}

/** Faction-by-faction kill rows + donut. Shared by the live session panel and the All-Time tab. */
export function KillsBreakdown({ kills, label, extra, donutSize = 96 }: KillsBreakdownProps) {
	const { t } = useI18n();

	const killData = KILL_DEFS.map((d) => ({
		...d,
		count: kills[d.key],
		color: FACTION_COLORS[d.key] ?? '#8a8070',
	}))
		.filter((d) => d.count > 0)
		.sort((a, b) => b.count - a.count);

	return (
		<div className={`${styles.killsContent} ${extra ? styles.withExtra : ''}`}>
			<div className={styles.killRows}>
				{killData.map((k) => (
					<div key={k.key} className={styles.killRow}>
						<div className={styles.killName}>
							{FACTION_ICONS[k.key] ? (
								<FactionIcon faction={k.key} size="xs" />
							) : k.icon ? (
								<div
									style={{
										width: 12,
										height: 12,
										background: FACTION_BG_COLORS[k.key] ?? '#1c1c1c',
										borderRadius: 2,
										flexShrink: 0,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<img src={k.icon} width={10} height={10} alt="" />
								</div>
							) : (
								<span
									className={styles.killDot}
									style={{ background: k.color }}
								/>
							)}
							<span style={{ color: k.color }}>{t(k.labelKey)}</span>
						</div>
						<span className={styles.killValue}>{k.count}</span>
					</div>
				))}
				{killData.length === 0 && <StatRow label={t('kills.none')} value="—" />}
			</div>
			<KillsDonut segments={killData} total={kills.total} label={label} size={donutSize} thickness={donutSize >= 120 ? 18 : 14} />
			{extra && <div className={styles.killExtra}>{extra}</div>}
		</div>
	);
}
