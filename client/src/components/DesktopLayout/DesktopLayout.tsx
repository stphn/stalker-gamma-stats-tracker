import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { StatsData, ActorInfo } from '../../types'
import { DEATH_LINES } from '../../utils/constants'
import { fmt_time, fmt_money, ordinal, fmt_location } from '../../utils/formatters'
import { LocationCard } from '../LocationCard/LocationCard'
import styles from './DesktopLayout.module.css'

interface DesktopLayoutProps {
    data: StatsData
    displayActor: ActorInfo | null
    gameState: 'playing' | 'menu' | 'off'
    stale: boolean
}

export function DesktopLayout({ data, displayActor, gameState, stale }: DesktopLayoutProps) {
    const alive = data.session.deaths === 0
    const deathLine = alive ? null : DEATH_LINES[(data.session).start % DEATH_LINES.length]
    const idleBadge = alive && gameState !== 'playing' ? (gameState === 'menu' ? 'In Menu' : 'Off') : null

    return (
        <div className={`dt-main ${styles.root}`} style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            {/* Location hero with overlay panels */}
            <div className={`${styles.hero}${alive ? '' : ` ${styles.heroDead}`}`}>
                {displayActor?.location && (
                    <LocationCard
                        location={displayActor.location}
                        locationName={displayActor.location_name}
                        gameTime={displayActor.game_time}
                        large
                        className={styles.heroCard}
                    />
                )}
                {!displayActor?.location && <div className={styles.heroEmpty} />}

                {/* Right overlay: kills + stats */}
                <div className={styles.overlay}>
                    <div className={styles.overlayRunHead}>
                        <div className={styles.overlayTitleRow}>
                            <span className={styles.runLabel}>{alive ? 'Current Run' : 'Last Run'}</span>
                            {idleBadge && <span className="run-idle-badge">{idleBadge}</span>}
                            {deathLine && <span className="death-line">{deathLine}</span>}
                        </div>
                        <span className={`run-icon ${alive ? 'alive' : 'dead'}`} style={{ fontSize: 16 }}>
                            {alive ? '♥' : '☠'}
                        </span>
                        <span className={styles.runTime}>{fmt_time(data.session.playtime)}</span>
                    </div>

                    {data.session.kills.total > 0 && (
                        <div className={styles.killsPanel}>
                            <div className={styles.panelLabel}>Kills</div>
                            <div className={styles.killsRows}>
                                {(
                                    [
                                        ['Loners',     data.session.kills.stalker,   '#d4a832', '/factions/faction_loners.png'],
                                        ['Bandits',    data.session.kills.bandit,    '#a8a8a8', '/factions/faction_bandits.png'],
                                        ['Military',   data.session.kills.military,  '#c8a830', '/factions/faction_military.png'],
                                        ['Freedom',    data.session.kills.freedom,   '#4cae5a', '/factions/faction_freedom.png'],
                                        ['Duty',       data.session.kills.duty,      '#c0362a', '/factions/faction_duty.png'],
                                        ['Ecologists', data.session.kills.ecolog,    '#c8b040', '/factions/faction_ecologists.png'],
                                        ['Clear Sky',  data.session.kills.csky,      '#4a9ee0', '/factions/faction_clearsky.png'],
                                        ['Monolith',   data.session.kills.monolith,  '#38b8b8', '/factions/faction_monolith.png'],
                                        ['Mercs',      data.session.kills.killer,    '#4a7ec8', '/factions/faction_mercenary.png'],
                                        ['Renegades',  data.session.kills.renegade,  '#7a8c30', '/factions/faction_renegades.png'],
                                        ['Mutants',    data.session.kills.mutant,    '#c0392b'],
                                        ['Helis',      data.session.kills.helicopter,'#f39c12'],
                                        ['Other',      data.session.kills.other,     '#7f8c8d'],
                                    ] as [string, number, string, string?][]
                                ).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]).map(([name, value, color, icon]) => (
                                    <div key={name} className={styles.killRow}>
                                        {icon
                                            ? <img className={styles.killIcon} src={icon} alt="" />
                                            : <span className={styles.killDot} style={{ background: color }} />
                                        }
                                        <span className={styles.killName} style={{ color }}>{name}</span>
                                        <span className={styles.killValue}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.killsDonut}>
                                <ResponsiveContainer width="100%" height={130}>
                                    <PieChart>
                                        <Pie
                                            data={(
                                                [
                                                    ['Loners',    data.session.kills.stalker,  '#d4a832'],
                                                    ['Bandits',   data.session.kills.bandit,   '#a8a8a8'],
                                                    ['Military',  data.session.kills.military, '#c8a830'],
                                                    ['Freedom',   data.session.kills.freedom,  '#4cae5a'],
                                                    ['Duty',      data.session.kills.duty,     '#c0362a'],
                                                    ['Ecologist', data.session.kills.ecolog,   '#c8b040'],
                                                    ['Clear Sky', data.session.kills.csky,     '#4a9ee0'],
                                                    ['Monolith',  data.session.kills.monolith, '#38b8b8'],
                                                    ['Mercs',     data.session.kills.killer,   '#4a7ec8'],
                                                    ['Renegades', data.session.kills.renegade, '#7a8c30'],
                                                    ['Mutants',   data.session.kills.mutant,   '#c0392b'],
                                                    ['Helis',     data.session.kills.helicopter,'#f39c12'],
                                                    ['Other',     data.session.kills.other,    '#7f8c8d'],
                                                ] as [string, number, string][]
                                            ).filter(r => r[1] > 0).map(([name, value, color]) => ({ name, value, color }))}
                                            cx="50%" cy="50%"
                                            innerRadius={35} outerRadius={55}
                                            dataKey="value" paddingAngle={2}
                                        >
                                            {(
                                                [
                                                    ['Loners',    data.session.kills.stalker,  '#d4a832'],
                                                    ['Bandits',   data.session.kills.bandit,   '#a8a8a8'],
                                                    ['Military',  data.session.kills.military, '#c8a830'],
                                                    ['Freedom',   data.session.kills.freedom,  '#4cae5a'],
                                                    ['Duty',      data.session.kills.duty,     '#c0362a'],
                                                    ['Ecologist', data.session.kills.ecolog,   '#c8b040'],
                                                    ['Clear Sky', data.session.kills.csky,     '#4a9ee0'],
                                                    ['Monolith',  data.session.kills.monolith, '#38b8b8'],
                                                    ['Mercs',     data.session.kills.killer,   '#4a7ec8'],
                                                    ['Renegades', data.session.kills.renegade, '#7a8c30'],
                                                    ['Mutants',   data.session.kills.mutant,   '#c0392b'],
                                                    ['Helis',     data.session.kills.helicopter,'#f39c12'],
                                                    ['Other',     data.session.kills.other,    '#7f8c8d'],
                                                ] as [string, number, string][]
                                            ).filter(r => r[1] > 0).map(([,, color], i) => (
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
                            <div className={styles.statRow}><span>Items Looted</span><span>{data.session.items}</span></div>
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

            {/* Death log strip */}
            {Array.isArray(data.last_run) && data.last_run.length > 0 && (
                <div className={styles.deathLog}>
                    {data.last_run.slice(0, 3).map((run, i) => {
                        const label = i === 0 ? 'Last Stand' : `${ordinal(i + 1)} Last Stand`
                        const loc = run.death_location ? fmt_location(run.death_location, run.death_location_name) : null
                        const date = new Date(run.start * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        return (
                            <div key={run.start} className={styles.deathCol}>
                                <div className={styles.deathHeader}>
                                    <span className={styles.deathTitle}>
                                        <span className="run-icon dead" style={{ fontSize: '0.8em', marginRight: 4 }}>☠</span>
                                        {label}
                                    </span>
                                    <span className={styles.deathDate}>{date}</span>
                                    <span className={styles.deathTime}>{fmt_time(run.playtime)}</span>
                                </div>
                                <div className={styles.deathStats}>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.kills.total}</span><span className={styles.deathLbl}>Kills</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.tasks}</span><span className={styles.deathLbl}>Tasks</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{fmt_money(run.rubles_earned)}</span><span className={styles.deathLbl}>Earned</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.artifacts}</span><span className={styles.deathLbl}>Artifacts</span></div>
                                    <div className={styles.deathStat}><span className={styles.deathVal}>{run.items}</span><span className={styles.deathLbl}>Items</span></div>
                                    {loc && <div className={styles.deathStat}><span className={styles.deathVal}>{loc}</span><span className={styles.deathLbl}>Died at</span></div>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
