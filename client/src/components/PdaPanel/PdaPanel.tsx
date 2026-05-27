import type { PdaStats } from '../../types';
import { fmt_money, fmt_time } from '../../utils/formatters';
import { CardHeader } from '../CardHeader/CardHeader';
import { StatRow } from '../StatRow/StatRow';
import styles from './PdaPanel.module.css';

interface PdaPanelProps {
	pda: PdaStats;
}

export function PdaPanel({ pda }: PdaPanelProps) {
	const net = pda.rubles_earned - pda.rubles_spent;

	return (
		<section className={styles.root}>
			<CardHeader label="PDA — All-Time Stats" accentColor="#c8a85a" />

			<div className={styles.grid}>
				{/* Combat */}
				<div className={styles.group}>
					<span className={styles.groupLabel}>Combat</span>
					<div className={styles.panel}>
						<StatRow label="Kills" value={pda.kills.total} />
						<StatRow label="Deaths" value={pda.deaths} />
						<StatRow
							label="Enemies Surrendered"
							value={pda.enemies_surrendered}
						/>
					</div>
				</div>

				{/* Economy */}
				<div className={styles.group}>
					<span className={styles.groupLabel}>Economy</span>
					<div className={styles.panel}>
						<StatRow label="Earned" value={fmt_money(pda.rubles_earned)} />
						<StatRow label="Spent" value={fmt_money(pda.rubles_spent)} />
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
					<span className={styles.groupLabel}>Zone</span>
					<div className={styles.panel}>
						<StatRow label="Emissions Survived" value={pda.emissions} />
						<StatRow label="Psi-Storms Survived" value={pda.psi_storms} />
						<StatRow label="Levels Visited" value={pda.levels_visited} />
					</div>
				</div>

				{/* Deeds */}
				<div className={styles.group}>
					<span className={styles.groupLabel}>Deeds</span>
					<div className={styles.panel}>
						<StatRow label="Wounded Helped" value={pda.wounded_helped} />
						<StatRow label="Field Dressings Used" value={pda.field_dressings} />
						<StatRow label="PDAs Delivered" value={pda.pdas_delivered} />
						<StatRow label="Boxes Smashed" value={pda.boxes_smashed} />
					</div>
				</div>

				{/* Exploration */}
				<div className={styles.group}>
					<span className={styles.groupLabel}>Exploration</span>
					<div className={styles.panel}>
						<StatRow label="Tasks Completed" value={pda.tasks} />
						<StatRow label="Tasks Failed" value={pda.tasks_failed} />
						<StatRow label="Tasks Cancelled" value={pda.tasks_cancelled} />
						<StatRow label="Stashes Found" value={pda.stashes} />
					</div>
				</div>

				{/* Knowledge */}
				<div className={styles.group}>
					<span className={styles.groupLabel}>Knowledge</span>
					<div className={styles.panel}>
						<StatRow label="Articles Read" value={pda.articles} />
						<StatRow label="Artifacts Found" value={pda.artifacts} />
						<StatRow label="Playtime" value={fmt_time(pda.playtime)} />
					</div>
				</div>
			</div>
		</section>
	);
}
