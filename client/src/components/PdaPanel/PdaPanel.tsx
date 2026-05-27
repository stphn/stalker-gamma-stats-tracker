import type { PdaStats } from '../../types';
import { fmt_money, fmt_time } from '../../utils/formatters';
import { CardHeader } from '../CardHeader/CardHeader';
import { StatRow } from '../StatRow/StatRow';
import styles from './PdaPanel.module.css';

interface PdaPanelProps {
	pda: PdaStats;
}

// Guard against fields the mod hasn't written yet
function n(v: number | undefined): number {
	return v ?? 0;
}

export function PdaPanel({ pda }: PdaPanelProps) {
	const earned = n(pda.rubles_earned);
	const spent = n(pda.rubles_spent);
	const net = earned - spent;

	return (
		<section className={styles.root}>
			<CardHeader label="PDA — All-Time Stats" accentColor="transparent" />

			<div className={styles.grid}>
				{/* Combat */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> Combat</span>
					<div className={styles.panel}>
						<StatRow label="Kills" value={n(pda.kills?.total)} />
						<StatRow label="Deaths" value={n(pda.deaths)} />
						<StatRow
							label="Enemies Surrendered"
							value={n(pda.enemies_surrendered)}
						/>
					</div>
				</div>

				{/* Economy */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> Economy</span>
					<div className={styles.panel}>
						<StatRow label="Earned" value={fmt_money(earned)} />
						<StatRow label="Spent" value={fmt_money(spent)} />
						<StatRow
							label="Net"
							value={fmt_money(net)}
							valueColor={
								net >= 0 ? 'var(--color-positive)' : 'var(--color-danger)'
							}
						/>
					</div>
				</div>

				{/* Zone events */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> Zone</span>
					<div className={styles.panel}>
						<StatRow label="Emissions Survived" value={n(pda.emissions)} />
						<StatRow label="Psi-Storms Survived" value={n(pda.psi_storms)} />
						<StatRow label="Levels Visited" value={n(pda.levels_visited)} />
					</div>
				</div>

				{/* Deeds */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> Deeds</span>
					<div className={styles.panel}>
						<StatRow label="Wounded Helped" value={n(pda.wounded_helped)} />
						<StatRow
							label="Field Dressings Used"
							value={n(pda.field_dressings)}
						/>
						<StatRow label="PDAs Delivered" value={n(pda.pdas_delivered)} />
						<StatRow label="Boxes Smashed" value={n(pda.boxes_smashed)} />
					</div>
				</div>

				{/* Exploration */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> Exploration</span>
					<div className={styles.panel}>
						<StatRow label="Tasks Completed" value={n(pda.tasks)} />
						<StatRow label="Tasks Failed" value={n(pda.tasks_failed)} />
						<StatRow label="Tasks Cancelled" value={n(pda.tasks_cancelled)} />
						<StatRow label="Stashes Found" value={n(pda.stashes)} />
					</div>
				</div>

				{/* Knowledge */}
				<div className={styles.group}>
					<span className={styles.groupLabel}><span aria-hidden="true">⠿</span> Knowledge</span>
					<div className={styles.panel}>
						<StatRow label="Articles Read" value={n(pda.articles)} />
						<StatRow label="Artifacts Found" value={n(pda.artifacts)} />
						<StatRow label="Playtime" value={fmt_time(pda.playtime)} />
					</div>
				</div>
			</div>
		</section>
	);
}
