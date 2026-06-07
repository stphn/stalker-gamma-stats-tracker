import type { ReactNode } from 'react';
import type { Kills } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import {
	FACTION_BG_COLORS,
	FACTION_COLORS,
} from '../../utils/constants';
import { FactionIcon } from '../FactionIcon/FactionIcon';
import { StatRow } from '../StatRow/StatRow';
import { Tooltip } from '../Tooltip/Tooltip';
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
					style={{ stroke: 'var(--border)' }}
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
	/** HUD form: donut on top, only the top-3 factions below. */
	compact?: boolean;
	/** Split the faction rows into two balanced columns (then donut) — All-Time combat. */
	splitRows?: boolean;
}

type KillDatum = (typeof KILL_DEFS)[number] & { count: number; color: string };

/** Faction-by-faction kill rows + donut. Shared by the live session panel and the All-Time tab. */
export function KillsBreakdown({ kills, label, extra, donutSize = 96, compact = false, splitRows = false }: KillsBreakdownProps) {
	const { t } = useI18n();

	const killData: KillDatum[] = KILL_DEFS.map((d) => ({
		...d,
		count: kills[d.key],
		color: FACTION_COLORS[d.key] ?? '#8a8070',
	}))
		.filter((d) => d.count > 0)
		.sort((a, b) => b.count - a.count);

	// A donut only conveys a breakdown with 2+ slices; a single faction is just a
	// full ring, so the HUD card drops it. The full panel always keeps it.
	const showDonut = compact ? killData.length >= 2 : true;

	// Split mode (All-Time combat): two balanced faction columns + a donut card.
	const split = splitRows && !compact && killData.length > 1;
	const mid = Math.ceil(killData.length / 2);

	const renderRow = (k: KillDatum) => {
		// "Other" is a catch-all (kills with no recognised faction); a hover tooltip
		// explains it.
		const isOther = k.key === 'other';
		const name = <span style={{ color: k.color }}>{t(k.labelKey)}</span>;
		return (
			<div key={k.key} className={styles.killRow}>
				<div className={`${styles.killName} ${isOther ? styles.killNameHelp : ''}`}>
					{k.icon ? (
						<div
							style={{
								width: 17,
								height: 17,
								background: FACTION_BG_COLORS[k.key] ?? '#1c1c1c',
								borderRadius: 2,
								flexShrink: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<img src={k.icon} width={13} height={13} alt="" />
						</div>
					) : (
						// Factions render their insignia; iconless kinds (other, helicopter)
						// fall back to the same empty bordered chip — same size & feel.
						<FactionIcon faction={k.key} size="xs" />
					)}
					{isOther ? (
						<Tooltip content={t('kills.otherNote')} multiline minWidth={200}>
							{name}
						</Tooltip>
					) : (
						name
					)}
				</div>
				<span className={styles.killValue}>{k.count}</span>
			</div>
		);
	};

	const donut = showDonut ? (
		<KillsDonut
			segments={killData}
			total={kills.total}
			label={label}
			size={donutSize}
			thickness={donutSize >= 120 ? 18 : 14}
		/>
	) : null;

	if (split) {
		return (
			<div className={`${styles.killsContent} ${styles.splitRows}`}>
				<div className={styles.killRows}>{killData.slice(0, mid).map(renderRow)}</div>
				<div className={styles.killRows}>{killData.slice(mid).map(renderRow)}</div>
				{donut}
			</div>
		);
	}

	return (
		<div
			className={`${styles.killsContent} ${extra ? styles.withExtra : ''} ${compact ? styles.compact : ''}`}
		>
			<div className={styles.killRows}>
				{killData.map(renderRow)}
				{killData.length === 0 && <StatRow label={t('kills.none')} value="—" />}
			</div>
			{donut}
			{extra && <div className={styles.killExtra}>{extra}</div>}
		</div>
	);
}
