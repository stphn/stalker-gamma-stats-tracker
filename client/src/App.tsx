import { useEffect, useRef, useState } from 'react';
import type { ActorInfo } from './types';
import { useStats } from './useStats';
import { fmt_money, fmt_time } from './utils/formatters';
import './App.css';

import { BloodSplatter } from './components/BloodSplatter/BloodSplatter';
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

	// Death detection — fires when last_run[0].start changes
	const [deathTrigger, setDeathTrigger] = useState(0);
	const [shaking, setShaking] = useState(false);
	const prevRunStart = useRef<number | null>(null);
	const latestDeathStart = data?.last_run?.[0]?.start ?? null;
	useEffect(() => {
		if (latestDeathStart == null) return;
		if (prevRunStart.current == null) {
			prevRunStart.current = latestDeathStart;
			return;
		}
		if (latestDeathStart !== prevRunStart.current) {
			prevRunStart.current = latestDeathStart;
			setDeathTrigger(latestDeathStart);
			setShaking(true);
			setTimeout(() => setShaking(false), 500);
		}
	}, [latestDeathStart]);

	return (
		<div style={{ overflow: 'hidden' }}>
		<div className={shaking ? 'app death-shake' : 'app'}>
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
						<BloodSplatter trigger={deathTrigger} key={deathTrigger} />
						<button
							className="dev-death-btn"
							onClick={() => { setDeathTrigger(Date.now()); setShaking(true); setTimeout(() => setShaking(false), 500); }}
							title="Test blood splatter"
						>
							💀 test death
						</button>
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
						<div className="death-log-wrap">
						<section className="death-log" aria-label="Death log">
							<div className="death-header" aria-hidden="true">
								<span />
								<span>Date</span>
								<span>Run</span>
								<span>Time</span>
								<span>Kills</span>
								<span>Earned</span>
								<span>Artifacts</span>
								<span>Tasks</span>
								<span>Stashes</span>
							</div>
							{data.last_run.slice(0, 3).map((run, i) => {
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
										className="death-row"
										aria-label={`Run ${i + 1} on ${date}`}
									>
										<span className="death-skull" aria-hidden="true">💀</span>
										<time className="death-date" dateTime={new Date(run.start * 1000).toISOString()}>{date}</time>
										<span className="death-run">#{i + 1}</span>
										<span>{fmt_time(run.playtime)}</span>
										<span>{run.kills.total}</span>
										<span>{fmt_money(run.rubles_earned)}</span>
										<span>{run.artifacts}</span>
										<span>{run.tasks}</span>
										<span>{run.stashes}</span>
									</article>
								);
							})}
						</section>
						</div>
					)}

					{data.alltime_official && <PdaPanel pda={data.alltime_official} />}
				</main>
			)}

			<footer className="site-footer" aria-label="External links">
				<div className="hud-frame" aria-hidden="true" />
				<span className="foot-label" aria-hidden="true">◈ External Refs</span>
				<div className="foot-links">
					<a
						className="foot-link"
						href="https://www.stalkergamma.com/"
						target="_blank"
						rel="noreferrer"
					>
						STALKER GAMMA
					</a>
					<span className="foot-sep" aria-hidden="true">|</span>
					<a
						className="foot-link"
						href="https://discord.gg/stalker-gamma"
						target="_blank"
						rel="noreferrer"
					>
						Discord
					</a>
					<span className="foot-sep" aria-hidden="true">|</span>
					<a
						className="foot-link"
						href="https://github.com/Grokitach/Stalker_GAMMA"
						target="_blank"
						rel="noreferrer"
					>
						GitHub
					</a>
				</div>
				<img
				src="/stalker-gamma.webp"
				alt="STALKER GAMMA"
				className="foot-gamma"
			/>
			</footer>
		</div>
		</div>
	);
}
