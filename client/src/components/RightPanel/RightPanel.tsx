import type { StatsData } from '../../types'
import { fmt_money } from '../../utils/formatters'
import { FACTION_COLORS, FACTION_ICONS, FACTION_BG_COLORS } from '../../utils/constants'
import { FactionIcon } from '../FactionIcon/FactionIcon'
import { CardHeader } from '../CardHeader/CardHeader'
import { StatRow } from '../StatRow/StatRow'
import styles from './RightPanel.module.css'

// Faction kills use FactionIcon (insignia + bg). Non-faction kill categories use a plain icon.
const KILL_DEFS: { name: string; key: keyof import('../../types').Kills; icon?: string }[] = [
    { name: 'Loners',     key: 'stalker'    },
    { name: 'Bandits',    key: 'bandit'     },
    { name: 'Military',   key: 'military'   },
    { name: 'Freedom',    key: 'freedom'    },
    { name: 'Duty',       key: 'duty'       },
    { name: 'Ecologists', key: 'ecolog'     },
    { name: 'Clear Sky',  key: 'csky'       },
    { name: 'Monolith',   key: 'monolith'   },
    { name: 'Mercs',      key: 'killer'     },
    { name: 'Renegades',  key: 'renegade'   },
    { name: 'Mutants',    key: 'mutant',    icon: '/factions/faction_mutant.png' },
    { name: 'Helis',      key: 'helicopter' },
    { name: 'Other',      key: 'other'      },
]

interface DonutProps {
    segments: { color: string; count: number }[]
    total: number
    size?: number
    thickness?: number
}

function KillsDonut({ segments, total, size = 96, thickness = 14 }: DonutProps) {
    const r = (size - thickness) / 2
    const C = 2 * Math.PI * r
    let accumulated = 0

    const arcs = segments
        .filter(s => s.count > 0)
        .map(s => {
            const fraction = s.count / total
            const dashLen = Math.max(0, fraction * C - 1.5)
            const offset = -accumulated * C
            accumulated += fraction
            return { color: s.color, dashLen, offset }
        })

    return (
        <div className={styles.donutWrap}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="#2a2a2a" strokeWidth={thickness} />
                {arcs.map((arc, i) => (
                    <circle key={i}
                        cx={size / 2} cy={size / 2} r={r}
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
                <span className={styles.donutLabel}>Kills</span>
            </div>
        </div>
    )
}

interface RightPanelProps {
    data: StatsData
}

export function RightPanel({ data }: RightPanelProps) {
    const { session } = data

    const killData = KILL_DEFS
        .map(d => ({ ...d, count: session.kills[d.key], color: FACTION_COLORS[d.key] ?? '#8a8070' }))
        .filter(d => d.count > 0)
        .sort((a, b) => b.count - a.count)

    return (
        <div className={styles.root}>
            {/* Kills */}
            <div className={styles.panel}>
                <CardHeader label="Kills" accentColor="#c85a5a" />
                <div className={styles.killsContent}>
                    <div className={styles.killRows}>
                        {killData.map(k => (
                            <div key={k.key} className={styles.killRow}>
                                <div className={styles.killName}>
                                    {FACTION_ICONS[k.key]
                                        ? <FactionIcon faction={k.key} size="xs" />
                                        : k.icon
                                            ? <div style={{ width: 12, height: 12, background: FACTION_BG_COLORS[k.key] ?? '#1c1c1c', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={k.icon} width={10} height={10} alt="" /></div>
                                            : <span className={styles.killDot} style={{ background: k.color }} />
                                    }
                                    <span style={{ color: k.color }}>{k.name}</span>
                                </div>
                                <span className={styles.killValue}>{k.count}</span>
                            </div>
                        ))}
                        {killData.length === 0 && (
                            <StatRow label="No kills yet" value="—" />
                        )}
                    </div>
                    <KillsDonut segments={killData} total={session.kills.total} />
                </div>
            </div>

            {/* Economy + Exploration */}
            <div className={styles.bottomRow}>
                <div className={styles.panel}>
                    <CardHeader label="Economy" accentColor="#5a8ab4" />
                    <div className={styles.statRows}>
                        <StatRow label="Earned" value={fmt_money(session.rubles_earned)} />
                        <StatRow label="Spent"  value={fmt_money(session.rubles_spent)} />
                        <StatRow label="Artifacts" value={session.artifacts} />
                    </div>
                </div>
                <div className={styles.panel}>
                    <CardHeader label="Exploration" accentColor="#8ab45a" />
                    <div className={styles.statRows}>
                        <StatRow label="Tasks Done"    value={session.tasks} />
                        <StatRow label="Stashes Found" value={session.stashes} />
                        <StatRow label="Level Changes" value={session.level_changes} />
                    </div>
                </div>
            </div>
        </div>
    )
}
