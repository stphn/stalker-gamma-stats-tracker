import { useRef } from 'react';
import type { ActorInfo } from './types';
import { useStats } from './useStats';
import { fmt_money, fmt_time } from './utils/formatters';
import './App.css';

import { Companions } from './components/Companions/Companions';
import { Header } from './components/Header/Header';
import { Location } from './components/Location/Location';
import { PdaPanel } from './components/PdaPanel/PdaPanel';
import { Player } from './components/Player/Player';
import { RightPanel } from './components/RightPanel/RightPanel';
import { Stage } from './components/Stage/Stage';

export default function App() {
	const { data, connected, stale } = useStats();
	const gameLive =
		connected && !!data && Date.now() / 1000 - data.last_updated < 15;
	const gameState = gameLive
		? data?.game_state === 'playing'
			? 'playing'
			: 'menu'
		: 'off';

	const lastActorRef = useRef<ActorInfo | null>(null);
	if (data?.actor?.name) lastActorRef.current = data.actor;
	const displayActor = data?.actor?.name ? data.actor : lastActorRef.current;

	return (
		<div className="app">
			<Header connected={connected} gameState={gameState} />

			{!data ? (
				<output className="empty">
					{connected
						? 'Waiting for stats — load a save in-game.'
						: 'Connecting to server…'}
				</output>
			) : (
				<main
					className="layout"
					aria-label="Stats dashboard"
					aria-busy={stale}
					style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
				>
					<div className="stage-row">
						<Stage
							location={displayActor?.location}
							left={
								displayActor && (
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
								)
							}
						/>
						<aside className="sidebar" aria-label="Session stats">
							<RightPanel data={data} />
						</aside>
					</div>

					{Array.isArray(data.last_run) && data.last_run.length > 0 && (
						<section className="death-log" aria-label="Death log">
							{data.last_run.slice(0, 3).map((run) => {
								const date = new Date(run.start * 1000)
									.toLocaleDateString('en-GB', {
										day: '2-digit',
										month: '2-digit',
										year: 'numeric',
									})
									.replace(/\//g, '.');
								return (
									<article
										key={run.start}
										className="death-col"
										aria-label={`Run on ${date}`}
									>
										<div className="death-col-header">
											<span className="death-col-title" aria-hidden="true">
												Death Log
											</span>
											<time
												className="death-col-date"
												dateTime={new Date(run.start * 1000).toISOString()}
											>
												{date}
											</time>
											<span className="death-col-time">
												{fmt_time(run.playtime)}
											</span>
										</div>
										<dl className="death-col-stats">
											<div className="death-stat">
												<dd className="death-val">{run.kills.total}</dd>
												<dt className="death-lbl">Kills</dt>
											</div>
											<div className="death-stat">
												<dd className="death-val">{run.tasks}</dd>
												<dt className="death-lbl">Tasks</dt>
											</div>
											<div className="death-stat">
												<dd className="death-val">
													{fmt_money(run.rubles_earned)}
												</dd>
												<dt className="death-lbl">Earned</dt>
											</div>
											<div className="death-stat">
												<dd className="death-val">{run.artifacts}</dd>
												<dt className="death-lbl">Artifacts</dt>
											</div>
											<div className="death-stat">
												<dd className="death-val">{run.items}</dd>
												<dt className="death-lbl">Items Looted</dt>
											</div>
											<div className="death-stat">
												<dd className="death-val">{run.stashes}</dd>
												<dt className="death-lbl">Stashes</dt>
											</div>
										</dl>
									</article>
								);
							})}
						</section>
					)}

					{data.alltime_official && <PdaPanel pda={data.alltime_official} />}
				</main>
			)}

			<footer className="site-footer" aria-label="External links">
				<a
					className="foot-link"
					href="https://www.stalkergamma.com/"
					target="_blank"
					rel="noreferrer"
				>
					STALKER GAMMA
				</a>
				<span className="foot-dot" aria-hidden="true">
					·
				</span>
				<a
					className="foot-link"
					href="https://discord.gg/stalker-gamma"
					target="_blank"
					rel="noreferrer"
				>
					Discord
				</a>
				<span className="foot-dot" aria-hidden="true">
					·
				</span>
				<a
					className="foot-link"
					href="https://github.com/Grokitach/Stalker_GAMMA"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</footer>
		</div>
	);
}
