import type { StatsBlock, SessionBlock, Companion } from '../../types'
import { DEATH_LINES } from '../../utils/constants'
import { fmt_time, fmt_money } from '../../utils/formatters'
import { LocationCard } from '../LocationCard/LocationCard'
import { SquadSection } from '../SquadSection/SquadSection'
import { KillBreakdown } from '../KillBreakdown/KillBreakdown'
import { StatGroup, StatCard } from '../StatCard/StatCard'

interface CurrentRunPanelProps {
    stats: StatsBlock
    location?: string
    locationName?: string
    gameTime?: { h: number; m: number }
    companions?: Companion[]
    gameState?: 'playing' | 'menu' | 'off'
}

export function CurrentRunPanel({ stats, location, locationName, gameTime, companions, gameState }: CurrentRunPanelProps) {
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
