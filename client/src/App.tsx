import { useRef } from 'react'
import { useStats } from './useStats'
import type { ActorInfo } from './types'
import { fmt_time, fmt_money } from './utils/formatters'
import './App.css'

import { Header } from './components/Header/Header'
import { Stage } from './components/Stage/Stage'
import { Location } from './components/Location/Location'
import { Player } from './components/Player/Player'
import { Companions } from './components/Companions/Companions'
import { RightPanel } from './components/RightPanel/RightPanel'

export default function App() {
    const { data, connected, stale } = useStats()
    const gameLive  = connected && !!data && (Date.now() / 1000 - data.last_updated) < 15
    const gameState = gameLive ? (data!.game_state === 'playing' ? 'playing' : 'menu') : 'off'

    const lastActorRef = useRef<ActorInfo | null>(null)
    if (data?.actor?.name) lastActorRef.current = data.actor
    const displayActor = data?.actor?.name ? data.actor : lastActorRef.current

    return (
        <div className="app">
            <Header connected={connected} gameState={gameState} />

            {!data ? (
                <div className="empty">
                    {connected ? 'Waiting for stats — load a save in-game.' : 'Connecting to server…'}
                </div>
            ) : (
                <div className="layout" style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <div className="stage-row">
                        <Stage
                            location={displayActor?.location}
                            left={displayActor && (
                                <>
                                    <Location
                                        location={displayActor.location}
                                        locationName={displayActor.location_name}
                                        gameTime={displayActor.game_time}
                                        gameState={gameState}
                                    />
                                    <div className="actors">
                                        <Player actor={displayActor} />
                                        {data.companions && data.companions.length > 0 && (
                                            <Companions companions={data.companions} />
                                        )}
                                    </div>
                                </>
                            )}
                        />
                        <aside className="sidebar">
                            <RightPanel data={data} />
                        </aside>
                    </div>

                    {Array.isArray(data.last_run) && data.last_run.length > 0 && (
                        <div className="death-log">
                            {data.last_run.slice(0, 3).map((run) => {
                                const date = new Date(run.start * 1000)
                                    .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                    .replace(/\//g, '.')
                                return (
                                    <div key={run.start} className="death-col">
                                        <div className="death-col-header">
                                            <span className="death-col-title">Death Log</span>
                                            <span className="death-col-date">{date}</span>
                                            <span className="death-col-time">{fmt_time(run.playtime)}</span>
                                        </div>
                                        <div className="death-col-stats">
                                            <div className="death-stat"><span className="death-val">{run.kills.total}</span><span className="death-lbl">Kills</span></div>
                                            <div className="death-stat"><span className="death-val">{run.tasks}</span><span className="death-lbl">Tasks</span></div>
                                            <div className="death-stat"><span className="death-val">{fmt_money(run.rubles_earned)}</span><span className="death-lbl">Earned</span></div>
                                            <div className="death-stat"><span className="death-val">{run.artifacts}</span><span className="death-lbl">Artifacts</span></div>
                                            <div className="death-stat"><span className="death-val">{run.items}</span><span className="death-lbl">Items Looted</span></div>
                                            <div className="death-stat"><span className="death-val">{run.stashes}</span><span className="death-lbl">Stashes</span></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
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
