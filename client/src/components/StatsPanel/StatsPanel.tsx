import type { StatsBlock } from '../../types'
import { fmt_money } from '../../utils/formatters'
import { CombatBar, KillBreakdown, PlaytimeBlock } from '../KillBreakdown/KillBreakdown'
import { StatGroup, StatCard } from '../StatCard/StatCard'
import styles from './StatsPanel.module.css'

export function StatsPanel({ title, stats }: { title: string; stats: StatsBlock }) {
    const hasCombat = stats.kills.total > 0 || stats.deaths > 0
    return (
        <section className="panel">
            <h2>{title}</h2>
            <div className="panel-body">
                {hasCombat && (
                    <div className={styles.panelCombat}>
                        <CombatBar kills={stats.kills.total} deaths={stats.deaths} />
                        <KillBreakdown kills={stats.kills} />
                    </div>
                )}
                <PlaytimeBlock seconds={stats.playtime} />
                <div className="stat-groups-row">
                    <StatGroup label="Economy" color="#e8a838">
                        <StatCard label="Rubles Earned" value={fmt_money(stats.rubles_earned)} />
                        <StatCard label="Rubles Spent"  value={fmt_money(stats.rubles_spent ?? 0)} />
                        <StatCard label="Artifacts"     value={stats.artifacts} />
                        <StatCard label="Items Looted"  value={stats.items} />
                    </StatGroup>
                    <StatGroup label="Exploration" color="#1abc9c">
                        <StatCard label="Tasks Done"    value={stats.tasks} />
                        <StatCard label="Stashes Found" value={stats.stashes} />
                        <StatCard label="Level Changes" value={stats.level_changes} />
                    </StatGroup>
                </div>
            </div>
        </section>
    )
}
