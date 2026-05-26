import { useRef } from 'react'
import { useStats } from './useStats'
import type { ActorInfo } from './types'
import './App.css'

import { PlayerCard } from './components/PlayerCard/PlayerCard'
import { DesktopLayout } from './components/DesktopLayout/DesktopLayout'
import { CurrentRunPanel } from './components/CurrentRunPanel/CurrentRunPanel'
import { LastRunPanel } from './components/LastRunPanel/LastRunPanel'
import { StatsPanel } from './components/StatsPanel/StatsPanel'
import { PdaStatsPanel } from './components/PdaStatsPanel/PdaStatsPanel'
import { Achievements, GameAchievementsPanel } from './components/Achievements/Achievements'

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
                    <span className="status-super-label">Status</span>
                    <div className="status-item">
                        <span className={`status-dot ${connected ? 'green' : 'red'}`} />
                        <span className={`status-label ${connected ? 'green' : 'red'}`}>Server</span>
                    </div>
                    <div className="status-item">
                        <span className={`status-dot ${gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red'}`} />
                        <span className={`status-label ${gameState === 'playing' ? 'green' : gameState === 'menu' ? 'amber' : 'red'}`}>Game</span>
                    </div>
                </div>
            </header>

            {/* ── Mobile player card (hidden on desktop) ── */}
            {displayActor && <PlayerCard actor={displayActor} money={displayActor.money} />}

            {!data ? (
                <div className="empty">
                    {connected ? 'Waiting for stats — load a save in-game.' : 'Connecting to server…'}
                </div>
            ) : (
                <>
                    {/* Desktop layout */}
                    <DesktopLayout data={data} displayActor={displayActor} gameState={gameState} stale={stale} />

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
