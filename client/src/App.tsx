import { useEffect, useRef, useState } from 'react';
import type { ActorInfo } from './types';
import { useI18n } from './i18n/I18nContext';
import { useMapPreload } from './hooks/useMapPreload';
import { useRuns } from './useRuns';
import { useStats } from './useStats';
import './App.css';

import { BloodSplatter } from './components/BloodSplatter/BloodSplatter';
import { Companions } from './components/Companions/Companions';
import { DeathLog } from './components/DeathLog/DeathLog';
import { DeathOverlay } from './components/DeathOverlay/DeathOverlay';
import { DebugPanel } from './components/DebugPanel/DebugPanel';
import { Header } from './components/Header/Header';
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher';
import { Location } from './components/Location/Location';
import { GameAchievementsPanel } from './components/GameAchievements/GameAchievements';
import { MapView } from './components/MapView/MapView';
import { Minimap } from './components/Minimap/Minimap';
import { Player } from './components/Player/Player';
import { RightPanel } from './components/RightPanel/RightPanel';
import { Stage } from './components/Stage/Stage';
import { StatsTabs } from './components/StatsTabs/StatsTabs';

export default function App() {
	const { t } = useI18n();
	const { data, connected, stale } = useStats();
	const { runs, total: totalRuns } = useRuns();
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

	// Night picks the night/ backdrop variant — 19:30–05:30 in-game (minute
	// precision). Levels without a night/ folder just fall back to their normal
	// images, so night art is opt-in per level.
	const gt = displayActor?.game_time;
	const gameMinutes = gt ? gt.h * 60 + gt.m : null;
	const night =
		gameMinutes != null &&
		(gameMinutes >= 19 * 60 + 30 || gameMinutes < 5 * 60 + 30);

	// Death detection — fires when last_run[0].start changes
	const [deathTrigger, setDeathTrigger] = useState(0);
	const [shaking, setShaking] = useState(false);
	const [mapOpen, setMapOpen] = useState(false);

	// Freshly-died row highlight (flash only — no scrolling)
	const [highlightStart, setHighlightStart] = useState<number | null>(null);

	// Latched death state: turns on when a death is detected, off when a new
	// run starts (game_state back to 'playing'). Decouples the takeover from
	// the live-freshness window so it doesn't vanish if pushes go stale.
	const [died, setDied] = useState(false);
	useEffect(() => {
		if (data?.game_state === 'playing') setDied(false);
	}, [data?.game_state]);

	// Debug-only: force the death takeover regardless of live game state
	const [previewDeath, setPreviewDeath] = useState(false);
	const showDeathScreen = died || gameState === 'dead' || previewDeath;

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
		// Exercise the log behaviour too: flash the newest row
		const newest = runs[0]?.start;
		if (newest != null) {
			setHighlightStart(newest);
			setTimeout(() => setHighlightStart(null), 5000);
		}
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
			setDied(true);
			setDeathTrigger(latestDeathStart);
			setShaking(true);
			setTimeout(() => setShaking(false), 500);
			// Flag the fresh row so it flashes in the log (no auto-scroll).
			setHighlightStart(latestDeathStart);
			const clear = setTimeout(() => setHighlightStart(null), 5000);
			return () => clearTimeout(clear);
		}
	}, [latestDeathStart]);

	return (
		<div style={{ overflow: 'hidden' }}>
		<div className={shaking ? 'app death-shake' : 'app'}>
			<a className="skip-link" href="#main">{t('a11y.skipToContent')}</a>
			<Header connected={connected} gameState={gameState} onMapOpen={() => setMapOpen(true)} />
			{debug && (
				<DebugPanel
					data={data}
					connected={connected}
					gameState={gameState}
					stale={stale}
					onTestDeath={triggerDeath}
					deathScreen={previewDeath}
					onToggleDeathScreen={() => setPreviewDeath(v => !v)}
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
				<output id="main" className="empty">
					{connected ? t('empty.waiting') : t('empty.connecting')}
				</output>
			) : (
				<main
					id="main"
					className="layout"
					aria-label="Stats dashboard"
					aria-busy={stale}
					style={stale ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
				>
					<div className="stage-row">
						<BloodSplatter trigger={deathTrigger} key={deathTrigger} />
						<Stage
							location={displayActor?.location}
							night={night}
							death={
								showDeathScreen ? (
									<DeathOverlay run={runs[0] ?? null} />
								) : undefined
							}
							left={
								displayActor && (
									<>
										<div className="compass-row">
											<Minimap actor={displayActor} onExpand={() => setMapOpen(true)} />
											<Location
												location={displayActor.location}
												locationName={displayActor.location_name}
												gameTime={displayActor.game_time}
												gameState={gameState}
											/>
										</div>
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
						<DeathLog runs={runs} totalRuns={totalRuns} highlightStart={highlightStart} />
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
					<span className="foot-sep" aria-hidden="true">|</span>
					<LanguageSwitcher />
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
