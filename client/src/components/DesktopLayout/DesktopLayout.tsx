import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { StatsData, ActorInfo } from '../../types'
import { FACTIONS, FACTION_COLORS, FACTION_ICONS } from '../../utils/constants'
import { fmt_time, fmt_money, rank_label, rep_label, rep_color, hp_color } from '../../utils/formatters'
import { LocationCard } from '../LocationCard/LocationCard'
import styles from './DesktopLayout.module.css'

interface DesktopLayoutProps {
    data: StatsData
    displayActor: ActorInfo | null
    gameState: 'playing' | 'menu' | 'off'
    stale: boolean
}

const KILL_DEFS = [
    { name: 'Loners',     key: 'stalker'    as const, color: '#d4a832', icon: '/factions/faction_loners.png' },
    { name: 'Bandits',    key: 'bandit'     as const, color: '#a8a8a8', icon: '/factions/faction_bandits.png' },
    { name: 'Military',   key: 'military'   as const, color: '#c8a830', icon: '/factions/faction_military.png' },
    { name: 'Freedom',    key: 'freedom'    as const, color: '#4cae5a', icon: '/factions/faction_freedom.png' },
    { name: 'Duty',       key: 'duty'       as const, color: '#c0362a', icon: '/factions/faction_duty.png' },
    { name: 'Ecologists', key: 'ecolog'     as const, color: '#c8b040', icon: '/factions/faction_ecologists.png' },
    { name: 'Clear Sky',  key: 'csky'       as const, color: '#4a9ee0', icon: '/factions/faction_clearsky.png' },
    { name: 'Monolith',   key: 'monolith'   as const, color: '#38b8b8', icon: '/factions/faction_monolith.png' },
    { name: 'Mercs',      key: 'killer'     as const, color: '#4a7ec8', icon: '/factions/faction_mercenary.png' },
    { name: 'Renegades',  key: 'renegade'   as const, color: '#7a8c30', icon: '/factions/faction_renegades.png' },
    { name: 'Mutants',    key: 'mutant'     as const, color: '#c0392b' },
    { name: 'Helis',      key: 'helicopter' as const, color: '#f39c12' },
    { name: 'Other',      key: 'other'      as const, color: '#7f8c8d' },
]

export function DesktopLayout({ data, displayActor, gameState, stale }: DesktopLayoutProps) {
    const alive = data.session.deaths === 0

    const killData = KILL_DEFS
        .map(d => ({ ...d, count: data.session.kills[d.key] }))
        .filter(d => d.count > 0)
        .sort((a, b) => b.count - a.count)

    return (
        <div className={`dt-main ${styles.root}`} style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <div className={`${styles.mainGrid}${alive ? '' : ` ${styles.mainGridDead}`}`}>

                {/* ── Left column: hero image + player profile ── */}
                <div className={styles.leftCol}>
                    <div className={styles.heroImageWrap}>
                        {displayActor?.location
                            ? <LocationCard
                                location={displayActor.location}
                                locationName={displayActor.location_name}
                                gameTime={displayActor.game_time}
                                live={gameState === 'playing'}
                                large fill
                              />
                            : <div className={styles.heroEmpty} />
                        }
                    </div>

                    {displayActor && (
                        <div className={styles.profilePanel}>
                            <div className={styles.profileTopBar}>Stalker</div>
                            <div className={styles.profileContent}>
                                <div className={styles.profileIdentity}>
                                    {FACTION_ICONS[displayActor.faction] && (
                                        <img className={styles.profileIcon} src={FACTION_ICONS[displayActor.faction]} alt="" />
                                    )}
                                    <div>
                                        <div className={styles.profileName}>{displayActor.name}</div>
                                        <div className={styles.profileFaction} style={{ color: FACTION_COLORS[displayActor.faction] ?? '#4a9eff' }}>
                                            {FACTIONS[displayActor.faction] ?? displayActor.faction}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.profileStats}>
                                    <div className={styles.profileStat}>
                                        <span className={styles.profileStatLabel}>Rank</span>
                                        <span className={styles.profileStatValue}>{rank_label(displayActor.rank)}</span>
                                    </div>
                                    <div className={styles.profileStat}>
                                        <span className={styles.profileStatLabel}>Experience</span>
                                        <span className={styles.profileStatValue} style={{ color: rep_color(displayActor.reputation) }}>
                                            {rep_label(displayActor.reputation)}
                                        </span>
                                    </div>
                                    <div className={styles.profileStat}>
                                        <span className={styles.profileStatLabel}>Balance</span>
                                        <span className={styles.profileStatValue} style={{ color: '#e8a838' }}>
                                            {fmt_money(displayActor.money)}
                                        </span>
                                    </div>
                                </div>

                                {data.companions && data.companions.length > 0 && (
                                    <div className={styles.squad}>
                                        <div className={styles.squadLabel}>Squad</div>
                                        {data.companions.map((c, i) => {
                                            const icon = FACTION_ICONS[c.faction]
                                            const color = hp_color(c.health)
                                            return (
                                                <div key={i} className={styles.squadRow}>
                                                    {icon
                                                        ? <img className={styles.squadIcon} src={icon} alt="" />
                                                        : <span className={styles.squadIcon} />
                                                    }
                                                    <span className={styles.squadName}>{c.name}</span>
                                                    <div className={styles.squadHp}>
                                                        <div className={styles.hpTrack}>
                                                            <div className={styles.hpFill} style={{ width: `${c.health}%`, background: color }} />
                                                        </div>
                                                        <span style={{ color, fontSize: 10, fontFamily: 'var(--font-display)' }}>{c.health}%</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right column: kills + economy + exploration ── */}
                <div className={styles.rightPanel}>
                    {killData.length > 0 && (
                        <div className={styles.killsPanel}>
                            <div className={styles.panelLabel}>Kills</div>
                            <div className={styles.killsRows}>
                                {killData.map(({ name, count, color, icon }) => (
                                    <div key={name} className={styles.killRow}>
                                        {icon
                                            ? <img className={styles.killIcon} src={icon} alt="" />
                                            : <span className={styles.killDot} style={{ background: color }} />
                                        }
                                        <span className={styles.killName} style={{ color }}>{name}</span>
                                        <span className={styles.killValue}>{count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.killsDonut}>
                                <ResponsiveContainer width="100%" height={130}>
                                    <PieChart>
                                        <Pie
                                            data={killData.map(({ name, count: value, color }) => ({ name, value, color }))}
                                            cx="50%" cy="50%"
                                            innerRadius={35} outerRadius={55}
                                            dataKey="value" paddingAngle={2}
                                        >
                                            {killData.map(({ color }, i) => (
                                                <Cell key={i} fill={color} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '3px', color: '#c9c9c9', fontFamily: 'Chakra Petch, monospace', fontSize: '11px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className={styles.statsPanels}>
                        <div className={styles.statsCol}>
                            <div className={styles.panelLabel}>Economy</div>
                            <div className={styles.statRow}><span>Rubles Earned</span><span>{fmt_money(data.session.rubles_earned)}</span></div>
                            <div className={styles.statRow}><span>Rubles Spent</span><span>{fmt_money(data.session.rubles_spent ?? 0)}</span></div>
                            <div className={styles.statRow}><span>Artifacts</span><span>{data.session.artifacts}</span></div>
                        </div>
                        <div className={styles.statsCol}>
                            <div className={styles.panelLabel}>Exploration</div>
                            <div className={styles.statRow}><span>Tasks Done</span><span>{data.session.tasks}</span></div>
                            <div className={styles.statRow}><span>Stashes Found</span><span>{data.session.stashes}</span></div>
                            <div className={styles.statRow}><span>Level Changes</span><span>{data.session.level_changes}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Death log strip ── */}
            {Array.isArray(data.last_run) && data.last_run.length > 0 && (
                <div className={styles.deathLog}>
                    {data.last_run.slice(0, 3).map((run) => {
                        const date = new Date(run.start * 1000)
                            .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            .replace(/\//g, '.')
                        return (
                            <div key={run.start} className={styles.deathCol}>
                                <div className={styles.deathHeader}>
                                    <span className={styles.deathTitle}>Death Log</span>
                                    <span className={styles.deathDate}>{date}</span>
                                    <span className={styles.deathTime}>{fmt_time(run.playtime)}</span>
                                </div>
                                <div className={styles.deathStats}>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.kills.total}</span><span className={styles.deathLbl}>Kills</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.tasks}</span><span className={styles.deathLbl}>Tasks</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{fmt_money(run.rubles_earned)}</span><span className={styles.deathLbl}>Earned</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.artifacts}</span><span className={styles.deathLbl}>Artifacts</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.items}</span><span className={styles.deathLbl}>Items Looted</span></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
