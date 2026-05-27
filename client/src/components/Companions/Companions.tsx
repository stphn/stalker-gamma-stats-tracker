import type { Companion } from '../../types';
import { FACTIONS, FACTION_COLORS } from '../../utils/constants';
import { hp_color } from '../../utils/formatters';
import styles from './Companions.module.css';

interface CompanionsProps {
	companions: Companion[];
}

export function Companions({ companions }: CompanionsProps) {
	return (
		<section className={styles.root} aria-label="Squad companions">
			<div className={styles.label} aria-hidden="true">
				Squad
			</div>
			<ul className={styles.grid}>
				{companions.map((c) => {
					const factionColor = FACTION_COLORS[c.faction] ?? '#e8c46a';
					const factionName = FACTIONS[c.faction] ?? c.faction;
					const hpColor = hp_color(c.health);
					return (
						<li key={c.name} className={styles.card}>
							<div className={styles.name}>{c.name}</div>
							<div className={styles.bottom}>
								<span
									className={styles.faction}
									style={{ color: factionColor }}
								>
									{factionName}
								</span>
								<div
									className={styles.hpTrack}
									role="meter"
									aria-label={`${c.name} health`}
									aria-valuenow={c.health}
									aria-valuemin={0}
									aria-valuemax={100}
								>
									<div
										className={styles.hpFill}
										style={{ width: `${c.health}%`, background: hpColor }}
									/>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
