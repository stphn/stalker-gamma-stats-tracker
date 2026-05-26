import type { ActorInfo } from '../../types'
import { FACTIONS, FACTION_COLORS, FACTION_ICONS } from '../../utils/constants'
import { fmt_location, fmt_money, rank_label, rep_label, rep_color } from '../../utils/formatters'
import styles from './PlayerCard.module.css'

export function PlayerCard({ actor, money }: { actor: ActorInfo; money?: number }) {
    const faction = FACTIONS[actor.faction] ?? actor.faction
    const factionColor = FACTION_COLORS[actor.faction] ?? '#4a9eff'
    const icon = FACTION_ICONS[actor.faction]
    return (
        <div className={`player-card ${styles.card}`}>
            {icon && <img className={styles.factionIcon} src={icon} alt={faction} />}
            <div className={styles.identity}>
                <div className={styles.name}>{actor.name}</div>
                <div className={styles.faction} style={{ color: factionColor }}>{faction}</div>
            </div>
            <div className={styles.divider} />
            <div className={styles.stats}>
                <div className={styles.statGroup}>
                    <div className={styles.row}>
                        <span className={styles.statLabel}>Rank</span>
                        <span className={styles.statValue}>{rank_label(actor.rank)} <span className={styles.statRaw}>{actor.rank}</span></span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.statLabel}>Reputation</span>
                        <span className={styles.statValue} style={{ color: rep_color(actor.reputation) }}>{rep_label(actor.reputation)} <span className={styles.statRaw}>{actor.reputation}</span></span>
                    </div>
                </div>
                <div className={styles.statGroup}>
                    {actor.location && (
                        <div className={styles.row}>
                            <span className={styles.statLabel}>Location</span>
                            <span className={styles.statValue}>{fmt_location(actor.location, actor.location_name)}</span>
                        </div>
                    )}
                    {money != null && (
                        <div className={styles.row}>
                            <span className={styles.statLabel}>Rubles</span>
                            <span className={styles.statValue} style={{ color: '#e8a838' }}>{fmt_money(money)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
