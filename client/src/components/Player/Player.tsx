import type { ActorInfo } from '../../types';
import { FACTIONS, FACTION_COLORS } from '../../utils/constants';
import {
	fmt_money,
	rank_label,
	rep_color,
	rep_label,
} from '../../utils/formatters';
import { FactionIcon } from '../FactionIcon/FactionIcon';
import styles from './Player.module.css';

interface PlayerProps {
	actor: ActorInfo;
}

export function Player({ actor }: PlayerProps) {
	const factionColor = FACTION_COLORS[actor.faction] ?? '#e8c46a';
	const factionName = FACTIONS[actor.faction] ?? actor.faction;

	return (
		<div className={styles.root}>
			<div className={styles.superLabel}>Stalker</div>
			<div className={styles.card}>
				<div className={styles.nameSection}>
					<div className={styles.name}>{actor.name}</div>
					<div className={styles.factionRow}>
						<FactionIcon faction={actor.faction} size="xs" />
						<span
							className={styles.factionName}
							style={{ color: factionColor }}
						>
							{factionName}
						</span>
					</div>
				</div>
				<div className={styles.statsRow}>
					<div className={styles.stat}>
						<span className={styles.statLabel}>Rank</span>
						<span className={styles.statValue} style={{ color: '#c8a85a' }}>
							{rank_label(actor.rank)}
						</span>
					</div>
					<div className={styles.separator} />
					<div className={styles.stat}>
						<span className={styles.statLabel}>Experience</span>
						<span
							className={styles.statValue}
							style={{ color: rep_color(actor.reputation) }}
						>
							{rep_label(actor.reputation)}
						</span>
					</div>
					<div className={styles.separator} />
					<div className={styles.stat}>
						<span className={styles.statLabel}>Rubles</span>
						<span className={styles.statValue} style={{ color: '#c8a85a' }}>
							{fmt_money(actor.money)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
