import { useEffect, useRef, useState } from 'react';
import type { ActorInfo } from '../types';
import { rank_label, rep_label } from '../utils/formatters';

export interface ProgressionToast {
	id: number;
	kind: 'rank' | 'rep';
	dir: 'up' | 'down';
	tierKey: string;
}

// Ordered low→high so a tier crossing's direction is derived from tier ORDER,
// never from the raw rank/reputation number (which increments constantly).
const RANK_ORDER = [
	'rank.novice',
	'rank.trainee',
	'rank.experienced',
	'rank.professional',
	'rank.veteran',
	'rank.expert',
	'rank.master',
	'rank.legend',
] as const;

const REP_ORDER = [
	'rep.terrible',
	'rep.bad',
	'rep.neutral',
	'rep.good',
	'rep.excellent',
] as const;

interface StoredTiers {
	rank: string;
	rep: string;
}

const storageKey = (name: string) => `tracker.progression.${name}`;

function readStored(name: string): StoredTiers | null {
	try {
		const raw = localStorage.getItem(storageKey(name));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredTiers>;
		if (typeof parsed.rank === 'string' && typeof parsed.rep === 'string') {
			return { rank: parsed.rank, rep: parsed.rep };
		}
		return null;
	} catch {
		return null;
	}
}

function writeStored(name: string, tiers: StoredTiers) {
	try {
		localStorage.setItem(storageKey(name), JSON.stringify(tiers));
	} catch {}
}

/** Direction of a tier change using the ordered list; raw sign is a tiebreak. */
function direction(
	order: readonly string[],
	from: string,
	to: string,
	rawSign: number,
): 'up' | 'down' {
	const a = order.indexOf(from);
	const b = order.indexOf(to);
	if (a !== -1 && b !== -1 && a !== b) return b > a ? 'up' : 'down';
	return rawSign >= 0 ? 'up' : 'down';
}

/**
 * Emits a toast when the player crosses a rank tier or reputation/experience
 * tier. Diffs the TIER LABEL (rare, meaningful) — never the raw number, which
 * climbs on almost every action. Initial tiers are seeded silently from
 * localStorage so first load and refreshes don't replay old promotions.
 */
export function useProgressionToasts(
	actor: ActorInfo | null | undefined,
	gameState: string,
) {
	const [toasts, setToasts] = useState<ProgressionToast[]>([]);
	const lastRankRef = useRef<string | null>(null);
	const lastRepRef = useRef<string | null>(null);
	const seededNameRef = useRef<string | null>(null);
	const idRef = useRef(0);

	const name = actor?.name;
	const rawRank = actor?.rank;
	const rawRep = actor?.reputation;

	useEffect(() => {
		if (!name || rawRank == null || rawRep == null) return;

		const rankTier = rank_label(rawRank);
		const repTier = rep_label(rawRep);

		// Seed silently the first time we see this actor (or on actor switch):
		// adopt the persisted tiers, or the current tiers if none were stored.
		if (seededNameRef.current !== name) {
			const stored = readStored(name);
			lastRankRef.current = stored?.rank ?? rankTier;
			lastRepRef.current = stored?.rep ?? repTier;
			seededNameRef.current = name;
			if (!stored) writeStored(name, { rank: rankTier, rep: repTier });
		}

		const prevRank = lastRankRef.current;
		const prevRep = lastRepRef.current;
		let changed = false;
		const next: ProgressionToast[] = [];

		if (prevRank != null && rankTier !== prevRank) {
			if (gameState === 'playing') {
				next.push({
					id: ++idRef.current,
					kind: 'rank',
					dir: direction(RANK_ORDER, prevRank, rankTier, 1),
					tierKey: rankTier,
				});
			}
			lastRankRef.current = rankTier;
			changed = true;
		}

		if (prevRep != null && repTier !== prevRep) {
			if (gameState === 'playing') {
				next.push({
					id: ++idRef.current,
					kind: 'rep',
					dir: direction(REP_ORDER, prevRep, repTier, rawRep),
					tierKey: repTier,
				});
			}
			lastRepRef.current = repTier;
			changed = true;
		}

		if (changed) writeStored(name, { rank: rankTier, rep: repTier });
		if (next.length > 0) setToasts((prev) => [...next.reverse(), ...prev]);
	}, [name, rawRank, rawRep, gameState]);

	const dismiss = (id: number) =>
		setToasts((prev) => prev.filter((toaster) => toaster.id !== id));

	// Debug-only: cycle through the four toast variants so each can be inspected
	// live (real tier crossings are rare and game-driven).
	const testRef = useRef(0);
	const pushTest = () => {
		const variants: Omit<ProgressionToast, 'id'>[] = [
			{ kind: 'rank', dir: 'up', tierKey: 'rank.veteran' },
			{ kind: 'rep', dir: 'up', tierKey: 'rep.good' },
			{ kind: 'rank', dir: 'down', tierKey: 'rank.experienced' },
			{ kind: 'rep', dir: 'down', tierKey: 'rep.bad' },
		];
		const v = variants[testRef.current % variants.length];
		testRef.current += 1;
		setToasts((prev) => [{ id: ++idRef.current, ...v }, ...prev]);
	};

	return { toasts, dismiss, pushTest };
}
