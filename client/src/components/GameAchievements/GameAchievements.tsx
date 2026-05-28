import type { GameAchievements, PdaStats } from '../../types';
import { CardHeader } from '../CardHeader/CardHeader';
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
		progress: (pda) => ({ value: n(pda.emissions) + n(pda.psi_storms), max: 25 }),
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
		progress: (_, ga) => ({ value: ga.earned, max: ga.total }),
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
		progress: (pda) => ({ value: n(pda.artifacts), max: 50 }),
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

interface GameAchievementsPanelProps {
	pda: PdaStats;
	gameAchievements: GameAchievements;
}

export function GameAchievementsPanel({ pda, gameAchievements }: GameAchievementsPanelProps) {
	const { earned, total, unlocked } = gameAchievements;

	return (
		<section className={styles.root}>
			<CardHeader
				label={`Official Achievements — ${earned} / ${total}`}
				accentColor="transparent"
			/>
			<div className={styles.grid}>
				{ACHIEVEMENTS.map((def) => {
					const isUnlocked = !!unlocked[def.id];
					const prog = !isUnlocked && def.progress ? def.progress(pda, gameAchievements) : null;
					const pct = prog ? Math.min(100, (prog.value / prog.max) * 100) : 0;

					return (
						<article
							key={def.id}
							className={isUnlocked ? `${styles.card} ${styles.unlocked}` : styles.card}
							aria-label={def.name}
						>
							<div className={styles.name}>
								<span className={styles.icon} aria-hidden="true">
									{isUnlocked ? '✓' : '○'}
								</span>
								{def.name}
							</div>
							<p className={styles.req}>{def.requirement}</p>
							<p className={styles.reward}>{def.reward}</p>
							{prog && (
								<>
									<div className={styles.barWrap} role="progressbar" aria-valuenow={prog.value} aria-valuemax={prog.max}>
										<div className={styles.bar} style={{ width: `${pct}%` }} />
									</div>
									<span className={styles.barLabel}>{prog.value} / {prog.max}</span>
								</>
							)}
						</article>
					);
				})}
			</div>
		</section>
	);
}
