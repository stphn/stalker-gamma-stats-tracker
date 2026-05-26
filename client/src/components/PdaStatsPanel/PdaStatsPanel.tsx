import type { PdaStats } from '../../types'
import { fmt_money } from '../../utils/formatters'
import { CombatBar, KillBreakdown } from '../KillBreakdown/KillBreakdown'
import { StatGroup, StatCard } from '../StatCard/StatCard'
import styles from './PdaStatsPanel.module.css'

export function PdaStatsPanel({ stats }: { stats: PdaStats }) {
    return (
        <section className="panel">
            <h2>PDA Stats</h2>
            <div className="panel-body">
                {stats.kills.total > 0 && (
                    <div className={styles.panelCombat}>
                        <CombatBar kills={stats.kills.total} />
                        <KillBreakdown kills={stats.kills} />
                    </div>
                )}
                <div className="stat-groups-row">
                    <StatGroup label="Tasks" color="#3498db">
                        <StatCard label="Completed"  value={stats.tasks} />
                        <StatCard label="Failed"     value={stats.tasks_failed} />
                        <StatCard label="Cancelled"  value={stats.tasks_cancelled} />
                    </StatGroup>
                    <StatGroup label="Economy" color="#e8a838">
                        <StatCard label="Current Money" value={fmt_money(stats.current_money ?? 0)} />
                        <StatCard label="Rubles Earned" value={fmt_money(stats.rubles_earned)} />
                        <StatCard label="Artifacts"     value={stats.artifacts} />
                        <StatCard label="Stashes Found" value={stats.stashes} />
                    </StatGroup>
                    <StatGroup label="Exploration" color="#1abc9c">
                        <StatCard label="Level Changes"  value={stats.level_changes} />
                        <StatCard label="Levels Visited" value={stats.levels_visited} />
                    </StatGroup>
                    <StatGroup label="Survival" color="#9b59b6">
                        <StatCard label="Emissions"       value={stats.emissions} />
                        <StatCard label="Psi-storms"      value={stats.psi_storms} />
                        <StatCard label="Field Dressings" value={stats.field_dressings} />
                        <StatCard label="Wounded Helped"  value={stats.wounded_helped} />
                        <StatCard label="Enemy Forfeits"  value={stats.enemies_surrendered} />
                        <StatCard label="PDAs Delivered"  value={stats.pdas_delivered} />
                        <StatCard label="Boxes Smashed"   value={stats.boxes_smashed} />
                        <StatCard label="Achievements"    value={stats.achievements_count} />
                    </StatGroup>
                </div>
            </div>
        </section>
    )
}
