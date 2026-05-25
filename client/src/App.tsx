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
            <div className={`combat-stats ${deaths != null ? 'with-deaths' : ''}`}>
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

function KillBreakdown({ kills }: { kills: Kills }) {
    const [view, setView] = useState<'list' | 'donut'>('donut')
    const allRows: [string, number, string][] = [
        ['Loners',      kills.stalker,    '#4a9eff'],
        ['Bandits',     kills.bandit,     '#e8a838'],
        ['Military',    kills.military,   '#5cb85c'],
        ['Freedom',     kills.freedom,    '#9b59b6'],
        ['Duty',        kills.duty,       '#e74c3c'],
        ['Ecologists',  kills.ecolog,     '#1abc9c'],
        ['Clear Sky',   kills.csky,       '#3498db'],
        ['Monolith',    kills.monolith,   '#8e44ad'],
        ['Mercs',       kills.killer,     '#e67e22'],
        ['Renegades',   kills.renegade,   '#95a5a6'],
        ['Mutants',     kills.mutant,     '#c0392b'],
        ['Helicopters', kills.helicopter, '#f39c12'],
        ['Other',       kills.other,      '#7f8c8d'],
    ]
    const rows = allRows.filter(r => r[1] > 0).sort((a, b) => b[1] - a[1])
    const pieData = rows.map(([name, value, color]) => ({ name, value, color }))

    return (
        <div className="kill-breakdown">
            <div className="kill-breakdown-header">
                <div className="kill-breakdown-label">By Type</div>
                <button className="view-toggle" onClick={() => setView(v => v === 'list' ? 'donut' : 'list')} title="Switch view">
                    {view === 'list' ? '◑' : '≡'}
                </button>
            </div>
            {rows.length === 0 && <div className="kill-empty">No kills yet</div>}
            {view === 'list' ? (
                rows.map(([label, count, color], i) => (
                    <div key={label} className="kill-list-row">
                        <span className="kill-list-rank">#{i + 1}</span>
                        <span className="kill-list-dot" style={{ background: color }} />
                        <span className="kill-list-name">{label}</span>
                        <span className="kill-list-count">{count}</span>
                    </div>
                ))
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={180}>
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
                    <div className="donut-legend">
                        {pieData.map(({ name, value, color }) => (
                            <div key={name} className="donut-legend-item">
                                <span className="donut-legend-dot" style={{ background: color }} />
                                <span className="donut-legend-name">{name}</span>
                                <span className="donut-legend-value">{value}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
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
    return (
        <section className="panel">
            <h2>{title}</h2>
            <div className="panel-body">
                <div className="stat-groups">
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
                <div className="panel-right">
                    <CombatBar kills={stats.kills.total} deaths={stats.deaths} />
                    <KillBreakdown kills={stats.kills} />
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
                <div className="stat-groups">
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
                <div className="panel-right">
                    <CombatBar kills={stats.kills.total} />
                    <KillBreakdown kills={stats.kills} />
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
                <div className="last-run-stat">
                    <span className="last-run-value">{run.kills.total}</span>
                    <span className="last-run-label">Kills</span>
                </div>
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
                <div className="stat-groups">
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
                <div className="panel-right">
                    <CombatBar kills={stats.kills.total} />
                    <KillBreakdown kills={stats.kills} />
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

export default function App() {
    const { data, connected, stale } = useStats()
    const gameLive  = connected && !!data && (Date.now() / 1000 - data.last_updated) < 15
    const gameState = gameLive ? (data!.game_state === 'playing' ? 'playing' : 'menu') : 'off'

    const lastActorRef = useRef<ActorInfo | null>(null)
    if (data?.actor?.name) lastActorRef.current = data.actor
    const displayActor = data?.actor?.name ? data.actor : lastActorRef.current

    return (
        <div className="app">
            <header>
                <div className="header-title">
                    <h1>T.R.A.C.K.E.R.</h1>
                    <div className="header-tagline">S.T.A.L.K.E.R. G.A.M.M.A. stat tracker</div>
                </div>
                <div className="status-group">
                    <div className="status-item">
                        <span className={`status-dot ${connected ? 'green' : 'red'}`} />
                        <span className="status-label">Server</span>
                    </div>
                    <div className="status-item">
                        <span className={`status-dot ${gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red'}`} />
                        <span className="status-label">{gameState === 'playing' ? 'Playing' : gameState === 'menu' ? 'In Menu' : 'Off'}</span>
                    </div>
                </div>
            </header>

            {displayActor && <PlayerCard actor={displayActor} money={displayActor.money} />}

            {!data ? (
                <div className="empty">
                    {connected ? 'Waiting for stats — load a save in-game.' : 'Connecting to server…'}
                </div>
            ) : (
                <main style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <CurrentRunPanel stats={data.session} location={displayActor?.location} locationName={displayActor?.location_name} gameTime={displayActor?.game_time} companions={data.companions} gameState={gameState} />
                    {Array.isArray(data.last_run) && data.last_run.map((run, i) => <LastRunPanel key={run.start} run={run} index={i} />)}
                    <StatsPanel title="All Time"          stats={data.alltime} />
                    {data.alltime_official && <PdaStatsPanel stats={data.alltime_official} />}
                    {data.game_achievements && <GameAchievementsPanel ga={data.game_achievements} />}
                    <Achievements achieved={data.achievements} />
                </main>
            )}

            <footer className="site-footer">
                <span><span className="foot-letter">T</span>asks</span>
                <span className="foot-dot">·</span>
                <span><span className="foot-letter">R</span>ubles</span>
                <span className="foot-dot">·</span>
                <span><span className="foot-letter">A</span>rtifacts</span>
                <span className="foot-dot">·</span>
                <span><span className="foot-letter">C</span>asualties</span>
                <span className="foot-dot">·</span>
                <span><span className="foot-letter">K</span>ills</span>
                <span className="foot-dot">·</span>
                <span><span className="foot-letter">E</span>missions</span>
                <span className="foot-dot">·</span>
                <span><span className="foot-letter">R</span>eputation</span>
            </footer>
        </div>
    )
}
