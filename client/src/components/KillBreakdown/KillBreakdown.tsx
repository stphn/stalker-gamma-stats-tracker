import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Kills } from '../../types'
import styles from './KillBreakdown.module.css'

export function KillBreakdown({ kills, large }: { kills: Kills; large?: boolean }) {
    const allRows: [string, number, string, string?][] = [
        ['Loners',      kills.stalker,    '#d4a832', '/factions/faction_loners.png'],
        ['Bandits',     kills.bandit,     '#a8a8a8', '/factions/faction_bandits.png'],
        ['Military',    kills.military,   '#c8a830', '/factions/faction_military.png'],
        ['Freedom',     kills.freedom,    '#4cae5a', '/factions/faction_freedom.png'],
        ['Duty',        kills.duty,       '#c0362a', '/factions/faction_duty.png'],
        ['Ecologists',  kills.ecolog,     '#c8b040', '/factions/faction_ecologists.png'],
        ['Clear Sky',   kills.csky,       '#4a9ee0', '/factions/faction_clearsky.png'],
        ['Monolith',    kills.monolith,   '#38b8b8', '/factions/faction_monolith.png'],
        ['Mercs',       kills.killer,     '#4a7ec8', '/factions/faction_mercenary.png'],
        ['Renegades',   kills.renegade,   '#7a8c30', '/factions/faction_renegades.png'],
        ['Mutants',     kills.mutant,     '#c0392b'],
        ['Helicopters', kills.helicopter, '#f39c12'],
        ['Other',       kills.other,      '#7f8c8d'],
    ]
    const rows = allRows.filter(r => r[1] > 0).sort((a, b) => b[1] - a[1])
    const pieData = rows.map(([name, value, color]) => ({ name, value, color }))

    if (kills.total === 0) return null

    return (
        <div className={styles.killBreakdown}>
            <div className={styles.killBreakdownLabel}>Kills</div>
            <div className={styles.donutRow}>
                <ResponsiveContainer width="100%" height={large ? 220 : 180}>
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                            {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '3px', color: '#c9c9c9', fontFamily: 'Chakra Petch, monospace', fontSize: '12px' }}
                            formatter={(value, name) => [value, name] as [typeof value, typeof name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className={`${styles.donutLegend}${large ? ` ${styles.donutLegendLarge}` : ''}`}>
                    {rows.map(([name, value, color, icon]) => (
                        <div key={name} className={styles.donutLegendItem}>
                            {icon
                                ? <img className={styles.donutLegendBadge} src={icon} alt="" />
                                : <span className={styles.donutLegendDot} style={{ background: color }} />
                            }
                            <span className={styles.donutLegendName} style={{ color }}>{name}</span>
                            <span className={styles.donutLegendValue}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function CombatBar({ kills, deaths }: { kills: number; deaths?: number }) {
    const kd = deaths != null
        ? (kills / Math.max(deaths, 1)).toFixed(2)
        : null
    return (
        <div className={styles.combatBar}>
            <div className={styles.combatBarLabel}>Combat</div>
            <div className={`${styles.combatStats}${deaths != null ? ` ${styles.withDeaths}` : ''}`}>
                <div className={styles.combatStat}>
                    <span className={styles.combatStatValue}>{kills}</span>
                    <span className={styles.combatStatLabel}>Kills</span>
                </div>
                {deaths != null && <>
                    <div className={styles.combatStat}>
                        <span className={styles.combatStatValue}>{deaths}</span>
                        <span className={styles.combatStatLabel}>Deaths</span>
                    </div>
                    <div className={styles.combatStat}>
                        <span className={styles.combatStatValue}>{kd}</span>
                        <span className={styles.combatStatLabel}>K/D</span>
                    </div>
                </>}
            </div>
        </div>
    )
}

export function PlaytimeBlock({ seconds }: { seconds: number }) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const parts = []
    if (h > 0) parts.push(`${h}h`)
    if (m > 0 || h > 0) parts.push(`${m}m`)
    parts.push(`${s}s`)
    return (
        <div className={styles.combatBar}>
            <div className={styles.combatBarLabel} style={{ color: '#e67e22', borderLeftColor: '#e67e22' }}>Time in the Zone</div>
            <div className={styles.combatStatValue}>{parts.join(' ')}</div>
        </div>
    )
}
