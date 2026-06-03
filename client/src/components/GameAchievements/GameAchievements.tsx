import { useState } from 'react';
import { LockIcon, LockOpenIcon } from '@phosphor-icons/react';
import type { Achievement, GameAchievements, PdaStats, StatsBlock } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_time } from '../../utils/formatters';
import styles from './GameAchievements.module.css';

interface Def {
	id: string;
	name: string;
	requirement: string;
	reward: string;
	progress?: (pda: PdaStats, ga: GameAchievements) => { value: number; max: number } | null;
}

const n = (v: number | undefined) => v ?? 0;

const ACHIEVEMENTS: Def[] = [
	{
		id: 'heavy_pockets',
		name: 'Heavy Pockets',
		requirement: 'Possess 10,000,000 RU',
		reward: 'Traders ignore goodwill requirements for high-tier gear',
	},
	{
		id: 'radiotherapy',
		name: 'Radiotherapy',
		requirement: 'Survive 25 emissions & psy-storms',
		reward: 'Chance to survive without taking cover',
		// Native requirement is 25 emissions AND 25 psi-storms, counted
		// separately — so progress is gated by whichever is still behind.
		progress: (pda) => ({ value: Math.min(n(pda.emissions), n(pda.psi_storms)), max: 25 }),
	},
	{
		id: 'infopreneur',
		name: 'Infopreneur',
		requirement: 'Deliver 50 PDAs to brokers',
		reward: 'Brokers pay a bonus per PDA',
		progress: (pda) => ({ value: n(pda.pdas_delivered), max: 50 }),
	},
	{
		id: 'duga_free',
		name: 'Duga Free',
		requirement: 'Disable the Miracle Machine & Brain Scorcher',
		reward: 'Stalkers more likely to traverse Yantar & Radar',
	},
	{
		id: 'well_dressed',
		name: 'Well Dressed',
		requirement: '500 mutants killed OR 250 field dressings',
		reward: 'Skin mutants much faster',
		progress: (pda) => {
			const byKills = n(pda.kills?.mutant) / 500;
			const byDress = n(pda.field_dressings) / 250;
			return byKills >= byDress
				? { value: n(pda.kills?.mutant), max: 500 }
				: { value: n(pda.field_dressings), max: 250 };
		},
	},
	{
		id: 'silver_or_lead',
		name: 'Silver or Lead',
		requirement: '500 stalkers killed OR 50 surrenders',
		reward: 'Surrendered stalkers reveal a second stash',
		progress: (pda) => {
			const bySurr = n(pda.enemies_surrendered) / 50;
			const byKill = n(pda.kills?.stalker) / 500;
			return bySurr >= byKill
				? { value: n(pda.enemies_surrendered), max: 50 }
				: { value: n(pda.kills?.stalker), max: 500 };
		},
	},
	{
		id: 'mechanized_warfare',
		name: 'Mechanized Warfare',
		requirement: 'Deliver all 3 tool sets to a single technician',
		reward: 'Repair bonus items are more effective',
	},
	{
		id: 'tourist',
		name: 'Tourist',
		requirement: 'Visit all 33 locations in the Zone',
		reward: 'Coordinates for 3 unique stashes',
		progress: (pda) => ({ value: n(pda.levels_visited), max: 33 }),
	},
	{
		id: 'rag_and_bone',
		name: 'Rag & Bone',
		requirement: 'Loot 100 stashes',
		reward: 'Occasionally find more loot in stashes',
		progress: (pda) => ({ value: n(pda.stashes), max: 100 }),
	},
	{
		id: 'completionist',
		name: 'Completionist',
		requirement: 'Unlock all other achievements',
		reward: 'The road has been long, but you\'ve arrived triumphant',
		// Unlocks at "all but ≤1 locked" — gate on the game's own achievement
		// total (minus completionist itself), not our hardcoded list length.
		progress: (_, ga) => ({ value: ga.earned, max: Math.max(1, (ga.total || ACHIEVEMENTS.length) - 1) }),
	},
	{
		id: 'wishful_thinking',
		name: 'Wishful Thinking',
		requirement: 'Complete the Living Legend storyline',
		reward: 'Unlocks Renegades as a playable faction',
	},
	{
		id: 'down_to_earth',
		name: 'Down to Earth',
		requirement: '3 helicopters with small arms OR 1 with explosive',
		reward: 'Mi-24 "Hind" replaced by weaker Mi-2 "Hoplite"',
		progress: (pda) => ({ value: n(pda.kills?.helicopter), max: 3 }),
	},
	{
		id: 'geologist',
		name: 'Geologist',
		requirement: 'Detect 50 artefacts',
		reward: 'Increased chance to find artefacts after emissions',
		// No bar: the game counts artefacts *detected* (via detector), but our
		// only artefact stat is those *obtained* — which outpaces it and would
		// show a misleading near-full bar on a locked card.
	},
	{
		id: 'patriarch',
		name: 'Folk Hero',
		requirement: 'Achieve the highest possible rank',
		reward: 'Recruit larger companion groups',
	},
	{
		id: 'bookworm_food',
		name: 'Bookworm Food',
		requirement: 'Unlock all encyclopedia articles',
		reward: 'Memory sticks replaced by rare PDAs',
	},
	{
		id: 'infantile_pleasure',
		name: 'Infantile Pleasure',
		requirement: 'Smash 200 boxes',
		reward: '25% chance of bonus loot from boxes',
		progress: (pda) => ({ value: n(pda.boxes_smashed), max: 200 }),
	},
	{
		id: 'recycler',
		name: 'Vigilant Recycler',
		requirement: 'Disassemble 200 items',
		reward: '33% chance of extra part from disassembly',
	},
	{
		id: 'artificer_eagerness',
		name: 'Artificer Eagerness',
		requirement: 'Craft 50 items',
		reward: 'Many recipes require fewer components',
	},
	{
		id: 'unforeseen_guest',
		name: 'Unforeseen Guest',
		requirement: 'Spend 5 hours in disguise',
		reward: 'Actions in disguise draw less suspicion',
	},
	{
		id: 'absolver',
		name: 'Absolver',
		requirement: 'Complete the Mortal Sin storyline',
		reward: 'Unlocks Sin as a playable faction',
	},
	{
		id: 'collaborator',
		name: 'Collaborator',
		requirement: 'Complete the Operation Afterglow storyline',
		reward: 'Unlocks UNISG as a playable faction',
	},
	{
		id: 'iron_curtain',
		name: 'Iron Curtain',
		requirement: 'Capture half of available territories [Warfare]',
		reward: '50,000 RU bonus',
	},
	{
		id: 'murky_spirit',
		name: 'Murky Spirit',
		requirement: 'All 3 "Lost to the Zone" storylines [Ironman]',
		reward: 'Major rank increase',
	},
	{
		id: 'invictus',
		name: 'Invictus',
		requirement: 'All 3 storylines · Ironman · Hardest difficulty · Max 1 death · No debug',
		reward: 'Bragging rights',
	},
];

/** Custom T.R.A.C.K.E.R. milestones — mirror of the mod's `ACH` table.
   Progress is derived client-side from cross-save `alltime` stats. */
interface CustomDef {
	id: string;
	max: number;
	value: (s: StatsBlock) => number;
	/** Optional label formatter (playtime → h/m, big numbers → grouped). */
	fmt?: (v: number) => string;
}

const fmtNum = (v: number) => v.toLocaleString('en-US');

const CUSTOM: CustomDef[] = [
	{ id: 'first_blood', max: 1, value: (s) => n(s.kills.total) },
	{ id: 'killer_100', max: 100, value: (s) => n(s.kills.total) },
	{ id: 'killer_500', max: 500, value: (s) => n(s.kills.total) },
	{ id: 'killer_1000', max: 1000, value: (s) => n(s.kills.total) },
	{ id: 'mutant_50', max: 50, value: (s) => n(s.kills.mutant) },
	{ id: 'bandit_50', max: 50, value: (s) => n(s.kills.bandit) },
	{ id: 'military_50', max: 50, value: (s) => n(s.kills.military) },
	{ id: 'first_death', max: 1, value: (s) => n(s.deaths) },
	{ id: 'deaths_10', max: 10, value: (s) => n(s.deaths) },
	{ id: 'task_1', max: 1, value: (s) => n(s.tasks) },
	{ id: 'task_25', max: 25, value: (s) => n(s.tasks) },
	{ id: 'task_100', max: 100, value: (s) => n(s.tasks) },
	{ id: 'artifact_1', max: 1, value: (s) => n(s.artifacts) },
	{ id: 'artifact_10', max: 10, value: (s) => n(s.artifacts) },
	{ id: 'stash_10', max: 10, value: (s) => n(s.stashes) },
	{ id: 'rich_100k', max: 100000, value: (s) => n(s.rubles_earned), fmt: fmtNum },
	{ id: 'explorer_25', max: 25, value: (s) => n(s.level_changes) },
	{ id: 'veteran_10h', max: 36000, value: (s) => n(s.playtime), fmt: fmt_time },
	{ id: 'veteran_50h', max: 180000, value: (s) => n(s.playtime), fmt: fmt_time },
];

interface GameAchievementsPanelProps {
	pda: PdaStats;
	gameAchievements: GameAchievements;
	/** Cross-save cumulative stats — drives custom achievement progress. */
	alltime: StatsBlock;
	/** Unlocked custom achievements (keyed by id), emitted by the mod. */
	custom: Record<string, Achievement>;
}

type AchTab = 'official' | 'custom';

interface Prog {
	value: number;
	max: number;
	fmt?: (v: number) => string;
}

export function GameAchievementsPanel({ pda, gameAchievements, alltime, custom }: GameAchievementsPanelProps) {
	const { t } = useI18n();
	const [tab, setTab] = useState<AchTab>('official');
	const { earned, unlocked } = gameAchievements;
	const officialTotal = ACHIEVEMENTS.length;

	// A custom milestone counts as earned if the mod persisted it OR our alltime
	// stats already meet the bar — the latter avoids a full bar on a locked card.
	const isCustomUnlocked = (def: CustomDef) =>
		!!custom[def.id] || def.value(alltime) >= def.max;
	const customEarned = CUSTOM.filter(isCustomUnlocked).length;

	const card = (id: string, isUnlocked: boolean, prog: Prog | null, reward?: string) => {
		const pct = prog ? Math.min(100, (prog.value / prog.max) * 100) : 0;
		const f = prog?.fmt ?? String;
		const name = t(`ach.${id}.name`);
		return (
			<article
				key={id}
				className={isUnlocked ? `${styles.card} ${styles.unlocked}` : styles.card}
				aria-label={name}
			>
				<div className={styles.name}>
					<span className={styles.icon} aria-hidden="true">
					{isUnlocked
						? <LockOpenIcon size={16} weight="fill" />
						: <LockIcon size={16} weight="fill" />}
				</span>
					{name}
				</div>
				<p className={styles.req}>{t(`ach.${id}.req`)}</p>
				{reward && <p className={styles.reward}>{reward}</p>}
				{prog && (
					<>
						<div className={styles.barWrap} role="progressbar" aria-valuenow={Math.min(prog.value, prog.max)} aria-valuemax={prog.max}>
							<div className={styles.bar} style={{ width: `${pct}%` }} />
						</div>
						{/* Clamp the label: some bars read a proxy stat that can outpace
						    the game's own counter, so never show >100% on a locked card. */}
						<span className={styles.barLabel}>{f(Math.min(prog.value, prog.max))} / {f(prog.max)}</span>
					</>
				)}
			</article>
		);
	};

	return (
		<section className={styles.root}>
			<div className={styles.head}>
				<span className={styles.heading}>{t('ach.heading')}</span>
				<div className={styles.tabBar} role="tablist" aria-label={t('ach.heading')}>
					<button
						type="button" role="tab" id="ach-tab-official" aria-controls="ach-panel"
						aria-selected={tab === 'official'}
						className={`${styles.tab} ${tab === 'official' ? styles.tabActive : ''}`}
						onClick={() => setTab('official')}
					>
						{t('ach.tab.official', { earned, total: officialTotal })}
					</button>
					<button
						type="button" role="tab" id="ach-tab-custom" aria-controls="ach-panel"
						aria-selected={tab === 'custom'}
						className={`${styles.tab} ${tab === 'custom' ? styles.tabActive : ''}`}
						onClick={() => setTab('custom')}
					>
						{t('ach.tab.custom', { earned: customEarned, total: CUSTOM.length })}
					</button>
				</div>
			</div>

			<div className={styles.grid} role="tabpanel" id="ach-panel" aria-labelledby={`ach-tab-${tab}`}>
				{tab === 'official'
					? ACHIEVEMENTS.map((def) => {
						const isUnlocked = !!unlocked[def.id];
						const prog = !isUnlocked && def.progress ? def.progress(pda, gameAchievements) : null;
						return card(def.id, isUnlocked, prog, t(`ach.${def.id}.reward`));
					})
					: CUSTOM.map((def) => {
						const isUnlocked = isCustomUnlocked(def);
						const prog = isUnlocked ? null : { value: def.value(alltime), max: def.max, fmt: def.fmt };
						return card(def.id, isUnlocked, prog);
					})}
			</div>
		</section>
	);
}
