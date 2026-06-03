import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AtomIcon,
  CalendarDotsIcon,
  CaretDoubleDownIcon,
  CaretDoubleUpIcon,
  CaretDownIcon,
  CaretUpIcon,
  ClockIcon,
  CoinsIcon,
  CrosshairIcon,
  FlagIcon,
  type Icon,
  PackageIcon,
  PersonSimpleRunIcon,
  RadioactiveIcon,
  SkullIcon,
  VaultIcon,
} from "@phosphor-icons/react";
import type { Run } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { fmt_money, fmt_run_datetime, fmt_time } from "../../utils/formatters";
import styles from "./DeathLog.module.css";

type SortKey =
  | "run"
  | "date"
  | "location"
  | "time"
  | "kills"
  | "earned"
  | "artifacts"
  | "tasks"
  | "stashes"
  | "items";

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
  align: "left" | "right";
  cellClass?: string;
  /** Sort comparator value. */
  value: (run: Run, zone: string) => number | string;
  /** Cell content. */
  render: (run: Run, ctx: CellCtx) => ReactNode;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "run",
    labelKey: "deathlog.run",
    Icon: PersonSimpleRunIcon,
    align: "left",
    cellClass: styles.run,
    value: (r) => r.start,
    render: (_r, c) => `#${c.runNo}`,
  },
  {
    key: "date",
    labelKey: "deathlog.date",
    Icon: CalendarDotsIcon,
    align: "left",
    cellClass: styles.date,
    value: (r) => r.start,
    render: (r) => (
      <time
        dateTime={new Date(r.start * 1000).toISOString()}
        title={new Date(r.start * 1000).toLocaleString()}
      >
        {fmt_run_datetime(r.start)}
      </time>
    ),
  },
  {
    key: "location",
    labelKey: "deathlog.location",
    Icon: RadioactiveIcon,
    align: "left",
    cellClass: styles.zone,
    value: (_r, zone) => zone.toLowerCase(),
    render: (_r, c) => c.zone,
  },
  {
    key: "time",
    labelKey: "deathlog.time",
    Icon: ClockIcon,
    align: "left",
    value: (r) => r.playtime ?? 0,
    render: (r) => fmt_time(r.playtime ?? 0),
  },
  {
    key: "kills",
    labelKey: "deathlog.kills",
    Icon: CrosshairIcon,
    align: "right",
    cellClass: styles.num,
    value: (r) => r.kills?.total ?? 0,
    render: (r) => r.kills?.total ?? 0,
  },
  {
    key: "earned",
    labelKey: "deathlog.earned",
    Icon: CoinsIcon,
    align: "right",
    cellClass: styles.num,
    value: (r) => r.rubles_earned ?? 0,
    render: (r, c) => fmt_money(r.rubles_earned ?? 0, c.locale),
  },
  {
    key: "artifacts",
    labelKey: "deathlog.artifacts",
    Icon: AtomIcon,
    align: "right",
    cellClass: styles.num,
    value: (r) => r.artifacts ?? 0,
    render: (r) => r.artifacts ?? 0,
  },
  {
    key: "tasks",
    labelKey: "deathlog.tasks",
    Icon: FlagIcon,
    align: "right",
    cellClass: styles.num,
    value: (r) => r.tasks ?? 0,
    render: (r) => r.tasks ?? 0,
  },
  {
    key: "stashes",
    labelKey: "deathlog.stashes",
    Icon: VaultIcon,
    align: "right",
    cellClass: styles.num,
    value: (r) => r.stashes ?? 0,
    render: (r) => r.stashes ?? 0,
  },
  {
    key: "items",
    labelKey: "deathlog.items",
    Icon: PackageIcon,
    align: "right",
    cellClass: styles.num,
    value: (r) => r.items ?? 0,
    render: (r) => r.items ?? 0,
  },
];

const COL_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c]));
// Preview rows shown before "show all" on normal/small screens — single table.
const PREVIEW = 3;
// Large desktop only: preview shows TWO_COL_SPLIT × 2 rows split into two
// side-by-side columns (5 + 5). Other screens keep the PREVIEW behaviour above.
const TWO_COL_SPLIT = 5;
const TWO_COL_PREVIEW = TWO_COL_SPLIT * 2;
// Container width (px) at which the preview goes two columns. Measured on the
// wrap element rather than the viewport, since the table lives in a container.
const TWO_COL_MIN_WIDTH = 1100;

// Fields always shown in the stacked (mobile) card; the rest are revealed by
// the per-card expand button. Desktop shows every column regardless.
const PRIMARY = new Set<SortKey>(["run", "date", "location", "time", "kills"]);

interface DeathLogProps {
  runs: Run[];
  /** All-time run count (so the newest row keeps its true ordinal, not its index). */
  totalRuns: number;
  /** `start` of a freshly-died run to flash, or null. */
  highlightStart: number | null;
}

export function DeathLog({ runs, totalRuns, highlightStart }: DeathLogProps) {
  const { t, locale } = useI18n();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showAll, setShowAll] = useState(false);
  // Track the wrap's rendered width so the preview can go two columns only
  // when there's actually room for two tables side by side.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setIsWide(entry.contentRect.width >= TWO_COL_MIN_WIDTH),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Per-card field expansion (stacked/mobile only): set of run.start values.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleExpand = (start: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(start)) next.delete(start);
      else next.add(start);
      return next;
    });

  const zoneOf = (run: Run) =>
    run.death_location_name ??
    (run.death_location ? t(`level.${run.death_location}`) : "—");

  // Chronological ordinal per run, independent of the current sort order.
  const runNoByStart = useMemo(() => {
    const ordered = [...runs].sort((a, b) => b.start - a.start);
    const m = new Map<number, number>();
    ordered.forEach((r, i) => m.set(r.start, (totalRuns || runs.length) - i));
    return m;
  }, [runs, totalRuns]);

  const sorted = useMemo(() => {
    const col = COL_BY_KEY.get(sortKey)!;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...runs].sort((a, b) => {
      const va = col.value(a, zoneOf(a));
      const vb = col.value(b, zoneOf(b));
      let cmp =
        typeof va === "string"
          ? va.localeCompare(vb as string)
          : (va as number) - (vb as number);
      if (cmp === 0) cmp = b.start - a.start; // stable tiebreak: newest first
      return dir * cmp;
    });
    // `locale` is the real trigger behind zoneOf's translations.
  }, [runs, sortKey, sortDir, locale]);

  // Large desktop previews more rows (to fill two columns); everything else
  // keeps the original short preview.
  const previewCount = isWide ? TWO_COL_PREVIEW : PREVIEW;
  const visible = showAll ? sorted : sorted.slice(0, previewCount);
  // Split the preview into two columns only when wide enough and there are
  // enough rows to fill a second column.
  const twoCol = !showAll && isWide && visible.length > TWO_COL_SPLIT;
  // The show-all/less toggle only appears when there's more than the preview.
  const hasToggle = runs.length > previewCount;

  const toggleDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  const onSort = (col: ColumnDef) => {
    if (sortKey === col.key) toggleDir();
    else {
      setSortKey(col.key);
      // Text columns read naturally A→Z; everything else most-relevant first.
      setSortDir(col.key === "location" ? "asc" : "desc");
    }
  };

  const renderTable = (rows: Run[]) => (
    <div className={styles.scroll}>
      <table className={styles.table} aria-label={t("deathlog.title")}>
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isActive = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={col.align === "right" ? styles.num : undefined}
                  aria-sort={
                    isActive
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className={`${styles.sort} ${isActive ? styles.sortActive : ""}`}
                    onClick={() => onSort(col)}
                  >
                    <col.Icon size={12} weight="bold" />
                    <span>{t(col.labelKey)}</span>
                    {isActive &&
                      (sortDir === "asc" ? (
                        <CaretUpIcon size={9} weight="bold" />
                      ) : (
                        <CaretDownIcon size={9} weight="bold" />
                      ))}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((run) => {
            const runNo = runNoByStart.get(run.start) ?? 0;
            const zone = zoneOf(run);
            const ctx: CellCtx = { t, locale, runNo, zone };
            const isExp = expanded.has(run.start);
            const rowClass = [
              run.start === highlightStart ? styles.rowNew : "",
              isExp ? styles.expandedRow : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <tr
                key={run.start}
                className={rowClass || undefined}
                aria-label={`Run ${runNo}, ${fmt_run_datetime(run.start)}, ${zone}, ${fmt_time(run.playtime ?? 0)}, ${run.kills?.total ?? 0} ${t("deathlog.kills")}`}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    data-label={t(col.labelKey)}
                    className={
                      [col.cellClass, PRIMARY.has(col.key) ? "" : styles.extra]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  >
                    {col.render(run, ctx)}
                  </td>
                ))}
                {/* Per-card expand (stacked view only; hidden on desktop via CSS) */}
                <td className={styles.expandCell}>
                  <button
                    type="button"
                    className={styles.expand}
                    onClick={() => toggleExpand(run.start)}
                    aria-expanded={isExp}
                  >
                    {isExp ? (
                      <>
                        <CaretDoubleUpIcon size={11} weight="bold" />
                        {t("layout.showLess")}
                      </>
                    ) : (
                      <>
                        <CaretDoubleDownIcon size={11} weight="bold" />
                        {t("layout.showMore")}
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      className={`${styles.wrap} ${hasToggle ? "" : styles.wrapNoToggle}`}
      ref={wrapRef}
    >
      <div className={styles.title}>
        <SkullIcon size={16} weight="fill" />
        <span>{t("deathlog.title")}</span>
      </div>

      {/* Mobile sort control — the stacked card layout hides the header row,
			    so this keeps every column sortable on small screens. */}
      <div className={styles.sortbar}>
        <label className="sr-only" htmlFor="death-sort-select">
          {t("deathlog.sortBy")}
        </label>
        <select
          id="death-sort-select"
          className={styles.sortbarSelect}
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          {COLUMNS.map((col) => (
            <option key={col.key} value={col.key}>
              {t(col.labelKey)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.sortbarDir}
          onClick={toggleDir}
          aria-label={t(
            sortDir === "asc" ? "deathlog.sortAsc" : "deathlog.sortDesc",
          )}
        >
          {sortDir === "asc" ? (
            <CaretUpIcon size={12} weight="bold" />
          ) : (
            <CaretDownIcon size={12} weight="bold" />
          )}
        </button>
      </div>

      {twoCol ? (
        <div className={styles.grid}>
          {renderTable(visible.slice(0, TWO_COL_SPLIT))}
          {renderTable(visible.slice(TWO_COL_SPLIT))}
        </div>
      ) : (
        renderTable(visible)
      )}

      {hasToggle && (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
        >
          {showAll ? (
            <>
              <CaretDoubleUpIcon size={12} weight="bold" />
              {t("deathlog.showLess")}
              <CaretDoubleUpIcon size={12} weight="bold" />
            </>
          ) : (
            <>
              <CaretDoubleDownIcon size={12} weight="bold" />
              {t("deathlog.showAll", { count: runs.length })}
              <CaretDoubleDownIcon size={12} weight="bold" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
