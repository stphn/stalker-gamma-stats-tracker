import { type ReactNode, useMemo, useState } from 'react';
import {
	Atom, CalendarDots, CaretDoubleDown, CaretDoubleUp, CaretDown, CaretUp,
	Clock, Coins, Crosshair, Flag, type Icon, Package, PersonSimpleRun,
	Radioactive, Skull, Vault,
} from '@phosphor-icons/react';
import type { Run } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_money, fmt_run_datetime, fmt_time } from '../../utils/formatters';

type SortKey =
	| 'run' | 'date' | 'location' | 'time' | 'kills'
	| 'earned' | 'artifacts' | 'tasks' | 'stashes' | 'items';

interface CellCtx {
	t: (k: string, p?: Record<string, string | number>) => string;
	locale: string;
	runNo: number;
	zone: string;
}

interface ColumnDef {
	key: SortKey;
	labelKey: string;
	Icon: Icon;
	align: 'left' | 'right';
	cellClass?: string;
	/** Sort comparator value. */
	value: (run: Run, zone: string) => number | string;
	/** Cell content. */
	render: (run: Run, ctx: CellCtx) => ReactNode;
}

const COLUMNS: ColumnDef[] = [
	{ key: 'run', labelKey: 'deathlog.run', Icon: PersonSimpleRun, align: 'left', cellClass: 'death-run',
		value: r => r.start, render: (_r, c) => `#${c.runNo}` },
	{ key: 'date', labelKey: 'deathlog.date', Icon: CalendarDots, align: 'left', cellClass: 'death-date',
		value: r => r.start,
		render: r => <time dateTime={new Date(r.start * 1000).toISOString()} title={new Date(r.start * 1000).toLocaleString()}>{fmt_run_datetime(r.start)}</time> },
	{ key: 'location', labelKey: 'deathlog.location', Icon: Radioactive, align: 'left', cellClass: 'death-zone',
		value: (_r, zone) => zone.toLowerCase(), render: (_r, c) => c.zone },
	{ key: 'time', labelKey: 'deathlog.time', Icon: Clock, align: 'left',
		value: r => r.playtime ?? 0, render: r => fmt_time(r.playtime ?? 0) },
	{ key: 'kills', labelKey: 'deathlog.kills', Icon: Crosshair, align: 'right', cellClass: 'death-num',
		value: r => r.kills?.total ?? 0, render: r => r.kills?.total ?? 0 },
	{ key: 'earned', labelKey: 'deathlog.earned', Icon: Coins, align: 'right', cellClass: 'death-num',
		value: r => r.rubles_earned ?? 0, render: (r, c) => fmt_money(r.rubles_earned ?? 0, c.locale) },
	{ key: 'artifacts', labelKey: 'deathlog.artifacts', Icon: Atom, align: 'right', cellClass: 'death-num',
		value: r => r.artifacts ?? 0, render: r => r.artifacts ?? 0 },
	{ key: 'tasks', labelKey: 'deathlog.tasks', Icon: Flag, align: 'right', cellClass: 'death-num',
		value: r => r.tasks ?? 0, render: r => r.tasks ?? 0 },
	{ key: 'stashes', labelKey: 'deathlog.stashes', Icon: Vault, align: 'right', cellClass: 'death-num',
		value: r => r.stashes ?? 0, render: r => r.stashes ?? 0 },
	{ key: 'items', labelKey: 'deathlog.items', Icon: Package, align: 'right', cellClass: 'death-num',
		value: r => r.items ?? 0, render: r => r.items ?? 0 },
];

const COL_BY_KEY = new Map(COLUMNS.map(c => [c.key, c]));
const PREVIEW = 4;

interface DeathLogProps {
	runs: Run[];
	/** All-time run count (so the newest row keeps its true ordinal, not its index). */
	totalRuns: number;
	/** `start` of a freshly-died run to flash, or null. */
	highlightStart: number | null;
}

export function DeathLog({ runs, totalRuns, highlightStart }: DeathLogProps) {
	const { t, locale } = useI18n();
	const [sortKey, setSortKey] = useState<SortKey>('date');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [showAll, setShowAll] = useState(false);

	const zoneOf = (run: Run) =>
		run.death_location_name ?? (run.death_location ? t(`level.${run.death_location}`) : '—');

	// Chronological ordinal per run, independent of the current sort order.
	const runNoByStart = useMemo(() => {
		const ordered = [...runs].sort((a, b) => b.start - a.start);
		const m = new Map<number, number>();
		ordered.forEach((r, i) => m.set(r.start, (totalRuns || runs.length) - i));
		return m;
	}, [runs, totalRuns]);

	const sorted = useMemo(() => {
		const col = COL_BY_KEY.get(sortKey)!;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...runs].sort((a, b) => {
			const va = col.value(a, zoneOf(a));
			const vb = col.value(b, zoneOf(b));
			let cmp = typeof va === 'string'
				? va.localeCompare(vb as string)
				: (va as number) - (vb as number);
			if (cmp === 0) cmp = b.start - a.start; // stable tiebreak: newest first
			return dir * cmp;
		});
		// `locale` is the real trigger behind zoneOf's translations.
	}, [runs, sortKey, sortDir, locale]);

	const visible = showAll ? sorted : sorted.slice(0, PREVIEW);

	const toggleDir = () => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
	const onSort = (col: ColumnDef) => {
		if (sortKey === col.key) toggleDir();
		else {
			setSortKey(col.key);
			// Text columns read naturally A→Z; everything else most-relevant first.
			setSortDir(col.key === 'location' ? 'asc' : 'desc');
		}
	};

	return (
		<div className="death-log-wrap">
			<div className="death-log-title">
				<Skull size={16} weight="fill" />
				<span>{t('deathlog.title')}</span>
			</div>

			{/* Mobile sort control — the stacked card layout hides the header row,
			    so this keeps every column sortable on small screens. */}
			<div className="death-sortbar">
				<label className="sr-only" htmlFor="death-sort-select">{t('deathlog.sortBy')}</label>
				<select
					id="death-sort-select"
					className="death-sortbar-select"
					value={sortKey}
					onChange={e => setSortKey(e.target.value as SortKey)}
				>
					{COLUMNS.map(col => (
						<option key={col.key} value={col.key}>{t(col.labelKey)}</option>
					))}
				</select>
				<button
					type="button"
					className="death-sortbar-dir"
					onClick={toggleDir}
					aria-label={t(sortDir === 'asc' ? 'deathlog.sortAsc' : 'deathlog.sortDesc')}
				>
					{sortDir === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
				</button>
			</div>

			<div className="death-log-scroll">
				<table className="death-log" aria-label={t('deathlog.title')}>
					<thead>
						<tr>
							{COLUMNS.map(col => {
								const isActive = sortKey === col.key;
								return (
									<th
										key={col.key}
										scope="col"
										className={col.align === 'right' ? 'death-num' : undefined}
										aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
									>
										<button
											type="button"
											className={`death-sort ${isActive ? 'death-sort--active' : ''}`}
											onClick={() => onSort(col)}
										>
											<col.Icon size={12} weight="bold" />
											<span>{t(col.labelKey)}</span>
											{isActive && (sortDir === 'asc'
												? <CaretUp size={9} weight="bold" />
												: <CaretDown size={9} weight="bold" />)}
										</button>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{visible.map(run => {
							const runNo = runNoByStart.get(run.start) ?? 0;
							const zone = zoneOf(run);
							const ctx: CellCtx = { t, locale, runNo, zone };
							return (
								<tr
									key={run.start}
									className={run.start === highlightStart ? 'death-row--new' : undefined}
									aria-label={`Run ${runNo}, ${fmt_run_datetime(run.start)}, ${zone}, ${fmt_time(run.playtime ?? 0)}, ${run.kills?.total ?? 0} ${t('deathlog.kills')}`}
								>
									{COLUMNS.map(col => (
										<td key={col.key} data-label={t(col.labelKey)} className={col.cellClass}>
											{col.render(run, ctx)}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{runs.length > PREVIEW && (
				<button
					type="button"
					className="death-log-toggle"
					onClick={() => setShowAll(v => !v)}
					aria-expanded={showAll}
				>
					{showAll ? (
						<><CaretDoubleUp size={12} weight="bold" />{t('deathlog.showLess')}<CaretDoubleUp size={12} weight="bold" /></>
					) : (
						<><CaretDoubleDown size={12} weight="bold" />{t('deathlog.showAll', { count: runs.length })}<CaretDoubleDown size={12} weight="bold" /></>
					)}
				</button>
			)}
		</div>
	);
}
