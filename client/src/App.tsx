import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStats } from './useStats'
import type { StatsBlock, SessionBlock, PdaStats, ActorInfo, Kills, GameAchievements, Companion } from './types'
import './App.css'

const LEVELS: Record<string, string> = {
    l01_escape:            'Cordon',
    l02_garbage:           'Garbage',
    l03_agroprom:          'Agroprom',
    l03u_agr_underground:  'Agroprom Underground',
    l04_darkvalley:        'Dark Valley',
    l04u_labx18:           'Lab X-18',
    l05_bar:               'Rostok',
    l06_rostok:            'Wild Territory',
    l07_military:          'Army Warehouses',
    l08_yantar:            'Yantar',
    l09_deadcity:          'Dead City',
    l10_limansk:           'Limansk',
    l10_radar:             'Radar',
    l10_red_forest:        'Red Forest',
    l10u_bunker:           'X-19 Bunker',
    l11_pripyat:           'Pripyat (SoC)',
    l11u_hospital:         'Hospital',
    l11u_sarcofag:         'Sarcophagus',
    l12_stancia:           'Chernobyl NPP',
    l12u_control_monolith: 'Control Monolith',
    l12u_sarcofag:         'Sarcophagus Interior',
    l13_generators:        'Generators',
    l16_military:          'Military Underground',
    l18_swamp:             'Swamps',
    l19_marsh:             'Marsh',
    labx8:                 'Lab X-8',
    jupiter:               'Jupiter',
    zaton:                 'Zaton',
    pripyat:               'Pripyat',
    k00_marsh:             'Great Swamps',
    k01_darkscape:         'Darkscape',
    k02_trucks_cemetery:   'Truck Cemetery',
    y04_pole:              'Meadow',
}

// Drop screenshots in public/locations/<key>/<key>_01.png, _02.png, …
// Missing locations render nothing — no broken images

function fmt_location(raw: string, name?: string) {
    if (name && name !== raw && !name.startsWith('st_level_')) return name
    return LEVELS[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const FACTIONS: Record<string, string> = {
    stalker: 'Loner', actor_stalker: 'Loner', bandit: 'Bandit', army: 'Military', freedom: 'Freedom',
    duty: 'Duty', ecolog: 'Ecologist', csky: 'Clear Sky', monolith: 'Monolith',
    actor: 'Loner', independent: 'Independent', killer: 'Mercenary',
}
const FACTION_COLORS: Record<string, string> = {
    stalker: '#4a9eff', actor_stalker: '#4a9eff', bandit: '#e8a838', army: '#5cb85c', freedom: '#9b59b6',
    duty: '#e74c3c', ecolog: '#1abc9c', csky: '#3498db', monolith: '#8e44ad',
    actor: '#4a9eff', killer: '#e67e22',
}
const FACTION_ICONS: Record<string, string> = {
    stalker: '/factions/faction_loners.png', actor_stalker: '/factions/faction_loners.png',
    actor: '/factions/faction_loners.png',
    bandit: '/factions/faction_bandits.png',
    army: '/factions/faction_military.png',
    freedom: '/factions/faction_freedom.png',
    duty: '/factions/faction_duty.png',
    ecolog: '/factions/faction_ecologists.png',
    csky: '/factions/faction_clearsky.png',
    monolith: '/factions/faction_monolith.png',
    killer: '/factions/faction_mercenary.png',
    independent: '/factions/faction_inisig.png',
}

function rank_label(r: number) {
    if (r >= 7200) return 'Legend'
    if (r >= 3600) return 'Master'
    if (r >= 1800) return 'Expert'
    if (r >= 900)  return 'Veteran'
    if (r >= 300)  return 'Experienced'
    return 'Novice'
}
function rep_label(r: number) {
    if (r >= 2000)  return 'Excellent'
    if (r >= 500)   return 'Good'
    if (r >= -500)  return 'Neutral'
    if (r >= -2000) return 'Bad'
    return 'Terrible'
}
function rep_color(r: number) {
    if (r >= 2000)  return '#2ecc71'
    if (r >= 500)   return '#27ae60'
    if (r >= -500)  return '#95a5a6'
    if (r >= -2000) return '#e67e22'
    return '#e74c3c'
}

function fmt_time(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
}

function fmt_money(n: number) {
    return n.toLocaleString('en-US') + ' ₽'
}

function PlaytimeBlock({ seconds }: { seconds: number }) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const parts = []
    if (h > 0) parts.push(`${h}h`)
    if (m > 0 || h > 0) parts.push(`${m}m`)
    parts.push(`${s}s`)
    return (
        <div className="combat-bar">
            <div className="combat-bar-label" style={{ color: '#e67e22', borderLeftColor: '#e67e22' }}>Time in the Zone</div>
            <div className="combat-stat-value">{parts.join(' ')}</div>
        </div>
    )
}

function CombatBar({ kills, deaths }: { kills: number; deaths?: number }) {
    const kd = deaths != null
        ? (kills / Math.max(deaths, 1)).toFixed(2)
        : null
    return (
        <div className="combat-bar">
            <div className="combat-bar-label">Combat</div>
            <div className={`combat-stats${deaths != null ? ' with-deaths' : ''}`}>
                <div className="combat-stat">
                    <span className="combat-stat-value">{kills}</span>
                    <span className="combat-stat-label">Kills</span>
                </div>
                {deaths != null && <>
                    <div className="combat-stat">
                        <span className="combat-stat-value">{deaths}</span>
                        <span className="combat-stat-label">Deaths</span>
                    </div>
                    <div className="combat-stat">
                        <span className="combat-stat-value">{kd}</span>
                        <span className="combat-stat-label">K/D</span>
                    </div>
                </>}
            </div>
        </div>
    )
}

function KillBreakdown({ kills, large }: { kills: Kills; large?: boolean }) {
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
        <div className={`kill-breakdown${large ? ' kill-breakdown--large' : ''}`}>
            <div className="kill-breakdown-label">Kills</div>
            <div className="donut-row">
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
                <div className={`donut-legend${large ? ' donut-legend--large' : ''}`}>
                    {rows.map(([name, value, color, icon]) => (
                        <div key={name} className="donut-legend-item">
                            {icon
                                ? <img className="donut-legend-badge" src={icon} alt="" />
                                : <span className="donut-legend-dot" style={{ background: color }} />
                            }
                            <span className="donut-legend-name" style={{ color }}>{name}</span>
                            <span className="donut-legend-value">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function day_period(h: number): { label: string; color: string } {
    if (h >= 5  && h < 7)  return { label: 'Dawn',  color: '#e67e22' }
    if (h >= 7  && h < 19) return { label: 'Day',   color: '#f1c40f' }
    if (h >= 19 && h < 22) return { label: 'Dusk',  color: '#e8a838' }
    return                         { label: 'Night', color: '#7f8fe4' }
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    const keyRef  = useRef(0)
    const prevRef = useRef(value)
    if (prevRef.current !== value) {
        prevRef.current = value
        keyRef.current++
    }
    return (
        <div className="stat-card">
            <div key={keyRef.current} className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    )
}

function StatGroup({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
    return (
        <div className="stat-group">
            <div className="stat-group-label" style={{ color }}>{label}</div>
            <div className="stat-grid">{children}</div>
        </div>
    )
}

function StatsPanel({ title, stats }: { title: string; stats: StatsBlock }) {
    const hasCombat = stats.kills.total > 0 || stats.deaths > 0
    return (
        <section className="panel">
            <h2>{title}</h2>
            <div className="panel-body">
                {hasCombat && (
                    <div className="panel-combat">
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


function LocationCard({ location, locationName, gameTime }: { location: string; locationName?: string; gameTime?: { h: number; m: number } }) {
    const [src, setSrc] = useState<string | null>(null)
    useEffect(() => {
        setSrc(null)
        const found: string[] = []
        let done = 0
        const total = 5
        for (let i = 1; i <= total; i++) {
            const s = `/locations/${location}/${location}_${String(i).padStart(2, '0')}.png`
            const img = new Image()
            const finish = () => { if (++done === total) { const f = found.filter(Boolean); setSrc(f[Math.floor(Math.random() * f.length)] ?? null) } }
            img.onload  = () => { found[i - 1] = s; finish() }
            img.onerror = finish
            img.src = s
        }
    }, [location])

    const name = fmt_location(location, locationName)
    const period = gameTime != null ? day_period(gameTime.h) : null
    const clock = gameTime != null
        ? `${String(gameTime.h).padStart(2,'0')}:${String(gameTime.m).padStart(2,'0')}`
        : null

    return (
        <div className="location-card">
            {src && <img className="location-card-img" src={src} alt="" />}
            <div className="location-card-overlay">
                <div className="location-card-name">{name}</div>
                {clock && period && (
                    <div className="location-card-time">
                        <span className="location-card-clock">{clock}</span>
                        <span className="location-card-period" style={{ color: period.color }}>{period.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

const DEATH_LINES = [
    'The Zone claims another stalker.',
    'Should\'ve brought more medkits.',
    'Every stalker meets the Zone eventually.',
    'The Zone doesn\'t forgive mistakes.',
    'One wrong step.',
    'Suit up. Try again.',
    'You pushed too far.',
    'Better luck next run, stalker.',
    'The anomalies had the last word.',
    'Even legends bleed.',
    'The Zone is unforgiving.',
    'Another name for the memorial wall.',
    'Rookie mistake. Won\'t happen again.',
    'Death comes for us all out here.',
    'The Zone giveth, the Zone taketh.',
]

function CurrentRunPanel({ stats, location, locationName, gameTime, companions, gameState }: { stats: StatsBlock; location?: string; locationName?: string; gameTime?: { h: number; m: number }; companions?: Companion[]; gameState?: 'playing' | 'menu' | 'off' }) {
    const alive = stats.deaths === 0
    const deathLine = alive ? null : DEATH_LINES[(stats as SessionBlock).start % DEATH_LINES.length]
    const idleBadge = alive && gameState && gameState !== 'playing'
        ? (gameState === 'menu' ? 'In Menu' : 'Off')
        : null
    return (
        <section className={`panel${alive ? '' : ' panel--dead'}`}>
            <div className="panel-head">
                <div className="panel-head-title">
                    <h2>{alive ? 'Current Run' : 'Last Run'}</h2>
                    {idleBadge && <span className="run-idle-badge">{idleBadge}</span>}
                    {deathLine && <div className="death-line">{deathLine}</div>}
                </div>
                <div className="run-status">
                    <span className="run-time">{fmt_time(stats.playtime)}</span>
                    <span className={`run-icon ${alive ? 'alive' : 'dead'}`}>
                        {alive ? '♥' : '☠'}
                    </span>
                </div>
            </div>
            {location && <LocationCard location={location} locationName={locationName} gameTime={gameTime} />}
            {companions && companions.length > 0 && <SquadSection companions={companions} />}
            <div className="panel-body">
                {stats.kills.total > 0 && <KillBreakdown kills={stats.kills} large />}
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

function ordinal(n: number) {
    const s = ['th','st','nd','rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function LastRunPanel({ run, index }: { run: SessionBlock; index: number }) {
    const loc = run.death_location
        ? fmt_location(run.death_location, run.death_location_name)
        : null
    const label = index === 0 ? 'Last Stand' : `${ordinal(index + 1)} Last Stand`
    return (
        <section className="panel last-run-panel">
            <div className="panel-head">
                <h2><span className="run-icon dead" style={{ fontSize: '0.85em', marginRight: '0.35em' }}>☠</span>{label}</h2>
                <div className="run-status">
                    <span className="run-time" style={{ color: 'var(--text-dim)' }}>{fmt_time(run.playtime)}</span>
                </div>
            </div>
            <div className="last-run-body">
                {run.kills.total > 0 && (
                    <div className="last-run-stat">
                        <span className="last-run-value">{run.kills.total}</span>
                        <span className="last-run-label">Kills</span>
                    </div>
                )}
                <div className="last-run-stat">
                    <span className="last-run-value">{run.tasks}</span>
                    <span className="last-run-label">Tasks</span>
                </div>
                <div className="last-run-stat">
                    <span className="last-run-value">{fmt_money(run.rubles_earned)}</span>
                    <span className="last-run-label">Earned</span>
                </div>
                <div className="last-run-stat">
                    <span className="last-run-value">{run.artifacts}</span>
                    <span className="last-run-label">Artifacts</span>
                </div>
                {loc && (
                    <div className="last-run-stat">
                        <span className="last-run-value">{loc}</span>
                        <span className="last-run-label">Died at</span>
                    </div>
                )}
            </div>
        </section>
    )
}

function Achievements({ achieved }: { achieved: Record<string, { name: string; desc: string; at: number }> }) {
    const list = Object.values(achieved).sort((a, b) => a.at - b.at)
    return (
        <section className="panel">
            <h2>Tracker Achievements <span className="ach-count">{list.length}</span></h2>
            {list.length === 0
                ? <p className="muted">None unlocked yet.</p>
                : <div className="ach-list">
                    {list.map(a => (
                        <div key={a.name} className="ach-item">
                            <span className="ach-name">{a.name}</span>
                            <span className="ach-desc">{a.desc}</span>
                        </div>
                    ))}
                  </div>
            }
        </section>
    )
}

function PdaStatsPanel({ stats }: { stats: PdaStats }) {
    return (
        <section className="panel">
            <h2>PDA Stats</h2>
            <div className="panel-body">
                {stats.kills.total > 0 && (
                    <div className="panel-combat">
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

function hp_color(pct: number) {
    if (pct >= 60) return '#2ecc71'
    if (pct >= 30) return '#e8a838'
    return '#e74c3c'
}

function SquadSection({ companions }: { companions: Companion[] }) {
    return (
        <div className="squad-section">
            <div className="squad-label">Squad</div>
            <div className="companions-list">
                {companions.map((c, i) => {
                    const icon = FACTION_ICONS[c.faction]
                    const factionName = FACTIONS[c.faction] ?? c.faction
                    const factionColor = FACTION_COLORS[c.faction] ?? '#4a9eff'
                    const color = hp_color(c.health)
                    return (
                        <div key={i} className="companion-row">
                            {icon
                                ? <img className="companion-icon" src={icon} alt={factionName} />
                                : <span className="companion-icon-placeholder" />
                            }
                            <div className="companion-identity">
                                <span className="companion-name">{c.name}</span>
                                <span className="companion-faction" style={{ color: factionColor }}>{factionName}</span>
                            </div>
                            <div className="companion-hp">
                                <div className="companion-hp-track">
                                    <div className="companion-hp-fill" style={{ width: `${c.health}%`, background: color }} />
                                </div>
                                <span className="companion-hp-pct" style={{ color }}>{c.health}%</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function PlayerCard({ actor, money }: { actor: ActorInfo; money?: number }) {
    const faction = FACTIONS[actor.faction] ?? actor.faction
    const factionColor = FACTION_COLORS[actor.faction] ?? '#4a9eff'
    const icon = FACTION_ICONS[actor.faction]
    return (
        <div className="player-card">
            {icon && <img className="player-faction-icon" src={icon} alt={faction} />}
            <div className="player-identity">
                <div className="player-name">{actor.name}</div>
                <div className="player-faction" style={{ color: factionColor }}>{faction}</div>
            </div>
            <div className="player-divider" />
            <div className="player-stats">
                <div className="player-stat-group">
                    <div className="player-row">
                        <span className="player-stat-label">Rank</span>
                        <span className="player-stat-value">{rank_label(actor.rank)} <span className="player-stat-raw">{actor.rank}</span></span>
                    </div>
                    <div className="player-row">
                        <span className="player-stat-label">Reputation</span>
                        <span className="player-stat-value" style={{ color: rep_color(actor.reputation) }}>{rep_label(actor.reputation)} <span className="player-stat-raw">{actor.reputation}</span></span>
                    </div>
                </div>
                <div className="player-stat-group">
                    {actor.location && (
                        <div className="player-row">
                            <span className="player-stat-label">Location</span>
                            <span className="player-stat-value">{fmt_location(actor.location, actor.location_name)}</span>
                        </div>
                    )}
                    {money != null && (
                        <div className="player-row">
                            <span className="player-stat-label">Rubles</span>
                            <span className="player-stat-value" style={{ color: '#e8a838' }}>{fmt_money(money)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function GameAchievementsPanel({ ga }: { ga: GameAchievements }) {
    const ids = Object.keys(ga.unlocked).sort()
    return (
        <section className="panel">
            <h2>
                In-Game Achievements
                <span className="ach-count">{ga.earned}/{ga.total}</span>
            </h2>
            {ids.length === 0
                ? <p className="muted">None unlocked yet.</p>
                : <div className="ach-list">
                    {ids.map(id => (
                        <div key={id} className="ach-item">
                            <span className="ach-name">{id.replace(/_/g, ' ')}</span>
                        </div>
                    ))}
                  </div>
            }
        </section>
    )
}

function DesktopCurrentRun({ data, displayActor, gameState, stale }: {
    data: import('./types').StatsData
    displayActor: ActorInfo | null
    gameState: 'playing' | 'menu' | 'off'
    stale: boolean
}) {
    const alive = data.session.deaths === 0
    const deathLine = alive ? null : DEATH_LINES[(data.session as SessionBlock).start % DEATH_LINES.length]
    const idleBadge = alive && gameState !== 'playing' ? (gameState === 'menu' ? 'In Menu' : 'Off') : null

    return (
        <div className="dt-main" style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            {/* Location hero with overlay panels */}
            <div className={`dt-hero${alive ? '' : ' dt-hero--dead'}`}>
                {displayActor?.location && <LocationCard location={displayActor.location} locationName={displayActor.location_name} gameTime={displayActor.game_time} />}
                {!displayActor?.location && <div className="dt-hero-empty" />}

                {/* Right overlay: kills + stats */}
                <div className="dt-overlay">
                    <div className="dt-overlay-run-head">
                        <div className="dt-overlay-title-row">
                            <span className="dt-run-label">{alive ? 'Current Run' : 'Last Run'}</span>
                            {idleBadge && <span className="run-idle-badge">{idleBadge}</span>}
                            {deathLine && <span className="death-line">{deathLine}</span>}
                        </div>
                        <span className={`run-icon ${alive ? 'alive' : 'dead'}`} style={{ fontSize: 16 }}>
                            {alive ? '♥' : '☠'}
                        </span>
                        <span className="dt-run-time">{fmt_time(data.session.playtime)}</span>
                    </div>

                    {data.session.kills.total > 0 && (
                        <div className="dt-kills-panel">
                            <div className="dt-panel-label">Kills</div>
                            <div className="dt-kills-rows">
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
                                ).filter(r => r[1] > 0).sort((a,b) => b[1]-a[1]).map(([name, value, color, icon]) => (
                                    <div key={name} className="dt-kill-row">
                                        {icon
                                            ? <img className="dt-kill-icon" src={icon} alt="" />
                                            : <span className="dt-kill-dot" style={{ background: color }} />
                                        }
                                        <span className="dt-kill-name" style={{ color }}>{name}</span>
                                        <span className="dt-kill-value">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="dt-kills-donut">
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

                    <div className="dt-stats-panels">
                        <div className="dt-stats-col">
                            <div className="dt-panel-label">Economy</div>
                            <div className="dt-stat-row"><span>Rubles Earned</span><span>{fmt_money(data.session.rubles_earned)}</span></div>
                            <div className="dt-stat-row"><span>Rubles Spent</span><span>{fmt_money(data.session.rubles_spent ?? 0)}</span></div>
                            <div className="dt-stat-row"><span>Artifacts</span><span>{data.session.artifacts}</span></div>
                            <div className="dt-stat-row"><span>Items Looted</span><span>{data.session.items}</span></div>
                        </div>
                        <div className="dt-stats-col">
                            <div className="dt-panel-label">Exploration</div>
                            <div className="dt-stat-row"><span>Tasks Done</span><span>{data.session.tasks}</span></div>
                            <div className="dt-stat-row"><span>Stashes Found</span><span>{data.session.stashes}</span></div>
                            <div className="dt-stat-row"><span>Level Changes</span><span>{data.session.level_changes}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Death log strip */}
            {Array.isArray(data.last_run) && data.last_run.length > 0 && (
                <div className="dt-death-log">
                    {data.last_run.slice(0, 3).map((run, i) => {
                        const label = i === 0 ? 'Last Stand' : `${ordinal(i + 1)} Last Stand`
                        const loc = run.death_location ? fmt_location(run.death_location, run.death_location_name) : null
                        const date = new Date(run.start * 1000).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })
                        return (
                            <div key={run.start} className="dt-death-col">
                                <div className="dt-death-header">
                                    <span className="dt-death-title">
                                        <span className="run-icon dead" style={{ fontSize: '0.8em', marginRight: 4 }}>☠</span>
                                        {label}
                                    </span>
                                    <span className="dt-death-date">{date}</span>
                                    <span className="dt-death-time">{fmt_time(run.playtime)}</span>
                                </div>
                                <div className="dt-death-stats">
                                    <div className="dt-death-stat"><span className="dt-death-val">{run.kills.total}</span><span className="dt-death-lbl">Kills</span></div>
                                    <div className="dt-death-stat"><span className="dt-death-val">{run.tasks}</span><span className="dt-death-lbl">Tasks</span></div>
                                    <div className="dt-death-stat"><span className="dt-death-val">{fmt_money(run.rubles_earned)}</span><span className="dt-death-lbl">Earned</span></div>
                                    <div className="dt-death-stat"><span className="dt-death-val">{run.artifacts}</span><span className="dt-death-lbl">Artifacts</span></div>
                                    {loc && <div className="dt-death-stat"><span className="dt-death-val">{loc}</span><span className="dt-death-lbl">Died at</span></div>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default function App() {
    const { data, connected, stale } = useStats()
    const gameLive  = connected && !!data && (Date.now() / 1000 - data.last_updated) < 15
    const gameState = gameLive ? (data!.game_state === 'playing' ? 'playing' : 'menu') : 'off'

    const lastActorRef = useRef<ActorInfo | null>(null)
    if (data?.actor?.name) lastActorRef.current = data.actor
    const displayActor = data?.actor?.name ? data.actor : lastActorRef.current

    return (
        <div className="app">
            {/* ── Top bar ── */}
            <header>
                <div className="header-title">
                    <h1>T.R.A.C.K.E.R.</h1>
                    <div className="header-tagline">A S.T.A.L.K.E.R. Anomaly Companion</div>
                </div>
                <div className="status-group">
                    <div className="status-item">
                        <span className={`status-dot ${connected ? 'green' : 'red'}`} />
                        <span className="status-label">Server</span>
                    </div>
                    <div className="status-item">
                        <span className={`status-dot ${gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red'}`} />
                        <span className="status-label">Game</span>
                    </div>
                </div>
            </header>

            {/* ── Profile strip (desktop) ── */}
            {displayActor && (
                <div className="dt-profile">
                    <div className="dt-profile-faction-label">Stalker</div>
                    <div className="dt-profile-row">
                        <div className="dt-profile-identity">
                            {FACTION_ICONS[displayActor.faction] && (
                                <img className="dt-profile-icon" src={FACTION_ICONS[displayActor.faction]} alt="" />
                            )}
                            <div>
                                <div className="dt-profile-name">{displayActor.name}</div>
                                <div className="dt-profile-faction" style={{ color: FACTION_COLORS[displayActor.faction] ?? '#4a9eff' }}>
                                    {FACTIONS[displayActor.faction] ?? displayActor.faction}
                                </div>
                            </div>
                        </div>
                        <div className="dt-profile-stats">
                            <div className="dt-profile-stat"><span className="dt-profile-stat-label">Rank</span><span className="dt-profile-stat-value">{rank_label(displayActor.rank)}</span></div>
                            <div className="dt-profile-stat"><span className="dt-profile-stat-label">Reputation</span><span className="dt-profile-stat-value" style={{ color: rep_color(displayActor.reputation) }}>{rep_label(displayActor.reputation)}</span></div>
                            <div className="dt-profile-stat"><span className="dt-profile-stat-label">Location</span><span className="dt-profile-stat-value">{fmt_location(displayActor.location, displayActor.location_name)}</span></div>
                            <div className="dt-profile-stat"><span className="dt-profile-stat-label">Rubles</span><span className="dt-profile-stat-value" style={{ color: '#e8a838' }}>{fmt_money(displayActor.money)}</span></div>
                        </div>
                        {data?.companions && data.companions.length > 0 && (
                            <div className="dt-profile-companions">
                                <div className="dt-profile-companions-label">Squad</div>
                                {data.companions.map((c, i) => {
                                    const icon = FACTION_ICONS[c.faction]
                                    const color = hp_color(c.health)
                                    return (
                                        <div key={i} className="dt-companion-row">
                                            {icon ? <img className="dt-companion-icon" src={icon} alt="" /> : <span className="dt-companion-icon" />}
                                            <span className="dt-companion-name">{c.name}</span>
                                            <div className="dt-companion-hp">
                                                <div className="dt-companion-hp-track">
                                                    <div className="dt-companion-hp-fill" style={{ width: `${c.health}%`, background: color }} />
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

            {/* ── Mobile player card (hidden on desktop) ── */}
            {displayActor && <PlayerCard actor={displayActor} money={displayActor.money} />}

            {!data ? (
                <div className="empty">
                    {connected ? 'Waiting for stats — load a save in-game.' : 'Connecting to server…'}
                </div>
            ) : (
                <>
                    {/* Desktop layout */}
                    <DesktopCurrentRun data={data} displayActor={displayActor} gameState={gameState} stale={stale} />

                    {/* Mobile layout */}
                    <main style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                        <CurrentRunPanel stats={data.session} location={displayActor?.location} locationName={displayActor?.location_name} gameTime={displayActor?.game_time} companions={data.companions} gameState={gameState} />
                        {Array.isArray(data.last_run) && data.last_run.map((run, i) => <LastRunPanel key={run.start} run={run} index={i} />)}
                        <StatsPanel title="All Time" stats={data.alltime} />
                        {data.alltime_official && <PdaStatsPanel stats={data.alltime_official} />}
                        {data.game_achievements && <GameAchievementsPanel ga={data.game_achievements} />}
                        <Achievements achieved={data.achievements} />
                    </main>
                </>
            )}

            <footer className="site-footer">
                <a className="foot-link" href="https://www.stalkergamma.com/" target="_blank" rel="noreferrer">STALKER GAMMA</a>
                <span className="foot-dot">·</span>
                <a className="foot-link" href="https://discord.gg/stalker-gamma" target="_blank" rel="noreferrer">Discord</a>
                <span className="foot-dot">·</span>
                <a className="foot-link" href="https://github.com/Grokitach/Stalker_GAMMA" target="_blank" rel="noreferrer">GitHub</a>
            </footer>
        </div>
    )
}
