import type { ActorInfo } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { FACTION_COLORS } from '../../utils/constants';
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
	const { t, locale } = useI18n();
	const factionColor = FACTION_COLORS[actor.faction] ?? '#e8c46a';
	const factionKey = `faction.${actor.faction}`;
	const factionName = t(factionKey) !== factionKey ? t(factionKey) : actor.faction;

	return (
		<section className={styles.root} aria-label={`Player: ${actor.name}`}>
			<div className={styles.superLabel} aria-hidden="true">
				{t('player.super')}
			</div>
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
				<dl className={styles.statsRow}>
					<div className={styles.stat}>
						<dt className={styles.statLabel}>{t('player.rank')}</dt>
						<dd className={styles.statValue} style={{ color: 'var(--accent-base)' }}>
							{t(rank_label(actor.rank))}
						</dd>
					</div>
					<div className={styles.separator} aria-hidden="true" />
					<div className={styles.stat}>
						<dt className={styles.statLabel}>{t('player.experience')}</dt>
						<dd
							className={styles.statValue}
							style={{ color: rep_color(actor.reputation) }}
						>
							{t(rep_label(actor.reputation))}
						</dd>
					</div>
					<div className={styles.separator} aria-hidden="true" />
					<div className={styles.stat}>
						<dt className={styles.statLabel}>{t('player.rubles')}</dt>
						<dd className={styles.statValue} style={{ color: 'var(--accent-base)' }}>
							{fmt_money(actor.money, locale)}
						</dd>
					</div>
				</dl>
			</div>
		</section>
	);
}
