import { Atom, CalendarDots, CaretDoubleDown, CaretDoubleUp, Clock, Coins, Crosshair, Flag, Package, PersonSimpleRun, Radioactive, Skull, Vault } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { ActorInfo } from './types';
import { useI18n } from './i18n/I18nContext';
import { useMapPreload } from './hooks/useMapPreload';
import { useRuns } from './useRuns';
import { useStats } from './useStats';
import { fmt_money, fmt_time } from './utils/formatters';
import './App.css';

import { BloodSplatter } from './components/BloodSplatter/BloodSplatter';
import { Companions } from './components/Companions/Companions';
import { DebugPanel } from './components/DebugPanel/DebugPanel';
import { Header } from './components/Header/Header';
import { Location } from './components/Location/Location';
import { GameAchievementsPanel } from './components/GameAchievements/GameAchievements';
import { MapView } from './components/MapView/MapView';
import { Minimap } from './components/Minimap/Minimap';
import { Player } from './components/Player/Player';
import { RightPanel } from './components/RightPanel/RightPanel';
import { Stage } from './components/Stage/Stage';
import { StatsTabs } from './components/StatsTabs/StatsTabs';

export default function App() {
	const { t, locale } = useI18n();
	const { data, connected, stale } = useStats();
	const { runs } = useRuns();
	const gameLive =
		connected && !!data && Date.now() / 1000 - data.last_updated < 15;
	const gameState = gameLive
		? data?.game_state === 'playing'
			? 'playing'
			: (data?.session?.deaths ?? 0) > 0
				? 'dead'
				: 'menu'
		: 'off';

	const lastActorRef = useRef<ActorInfo | null>(null);
	if (data?.actor?.name) lastActorRef.current = data.actor;
	const displayActor = data?.actor?.name ? data.actor : lastActorRef.current;

	// Warm the cache for every map in the background (current level first)
	useMapPreload(displayActor?.location);

	// Death detection — fires when last_run[0].start changes
	const [deathTrigger, setDeathTrigger] = useState(0);
	const [shaking, setShaking] = useState(false);
	const [mapOpen, setMapOpen] = useState(false);
	const [showAllRuns, setShowAllRuns] = useState(false);
	const DEATHLOG_PREVIEW = 4;
	const visibleRuns = showAllRuns ? runs : runs.slice(0, DEATHLOG_PREVIEW);

	// Site-wide debug panel, toggled with D
	const [debug, setDebug] = useState(false);
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const el = e.target as HTMLElement;
			if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
			if (e.key === 'd' || e.key === 'D') setDebug(v => !v);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	const triggerDeath = () => {
		setDeathTrigger(Date.now());
		setShaking(true);
		setTimeout(() => setShaking(false), 500);
	};
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
			<Header connected={connected} gameState={gameState} onMapOpen={() => setMapOpen(true)} />
			{debug && (
				<DebugPanel
					data={data}
					connected={connected}
					gameState={gameState}
					stale={stale}
					onTestDeath={triggerDeath}
					onClose={() => setDebug(false)}
				/>
			)}
			{mapOpen && (
				<MapView
					actor={displayActor}
					onClose={() => setMapOpen(false)}
					gameState={gameState}
					debug={debug}
					runs={runs}
					companions={data?.companions}
				/>
			)}

			{!data ? (
				<output className="empty">
					{connected ? t('empty.waiting') : t('empty.connecting')}
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
										<Minimap actor={displayActor} onExpand={() => setMapOpen(true)} />
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

					{runs.length > 0 && (
						<div className="death-log-wrap">
						<div className="death-log-title">
							<Skull size={16} weight="fill" />
							<span>{t('deathlog.title')}</span>
						</div>
						<section className="death-log" aria-label="Death log">
							<div className="death-header" aria-hidden="true">
								<span><PersonSimpleRun size={12} weight="bold" />{t('deathlog.run')}</span>
								<span><CalendarDots size={12} weight="bold" />{t('deathlog.date')}</span>
								<span><Radioactive size={12} weight="bold" />{t('deathlog.location')}</span>
								<span><Clock size={12} weight="bold" />{t('deathlog.time')}</span>
								<span><Crosshair size={12} weight="bold" />{t('deathlog.kills')}</span>
								<span><Coins size={12} weight="bold" />{t('deathlog.earned')}</span>
								<span><Atom size={12} weight="bold" />{t('deathlog.artifacts')}</span>
								<span><Flag size={12} weight="bold" />{t('deathlog.tasks')}</span>
								<span><Vault size={12} weight="bold" />{t('deathlog.stashes')}</span>
								<span><Package size={12} weight="bold" />{t('deathlog.items')}</span>
							</div>
							{visibleRuns.map((run, i) => {
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
										<span className="death-run">#{i + 1}</span>
										<time className="death-date" dateTime={new Date(run.start * 1000).toISOString()}>{date}</time>
										<span className="death-zone">{run.death_location_name ?? (run.death_location ? t(`level.${run.death_location}`) : '—')}</span>
										<span>{fmt_time(run.playtime ?? 0)}</span>
										<span>{run.kills?.total ?? 0}</span>
										<span>{fmt_money(run.rubles_earned ?? 0, locale)}</span>
										<span>{run.artifacts ?? 0}</span>
										<span>{run.tasks ?? 0}</span>
										<span>{run.stashes ?? 0}</span>
										<span>{run.items ?? 0}</span>
									</article>
								);
							})}
							{runs.length > DEATHLOG_PREVIEW && (
								<button
									type="button"
									className="death-log-toggle"
									onClick={() => setShowAllRuns((v) => !v)}
									aria-expanded={showAllRuns}
								>
									{showAllRuns ? (
										<><CaretDoubleUp size={12} weight="bold" />{t('deathlog.showLess')}<CaretDoubleUp size={12} weight="bold" /></>
									) : (
										<><CaretDoubleDown size={12} weight="bold" />{t('deathlog.showAll', { count: runs.length })}<CaretDoubleDown size={12} weight="bold" /></>
									)}
								</button>
							)}
						</section>
						</div>
					)}

					<StatsTabs data={data} />
					{data.alltime_official && data.game_achievements && (
						<GameAchievementsPanel
							pda={data.alltime_official}
							gameAchievements={data.game_achievements}
						/>
					)}
				</main>
			)}

			<footer className="site-footer" aria-label="External links">
				<div className="hud-frame" aria-hidden="true" />
				<span className="foot-label" aria-hidden="true">◈ {t('footer.label')}</span>
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
