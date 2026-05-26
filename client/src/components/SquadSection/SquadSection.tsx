import type { Companion } from '../../types'
import { FACTIONS, FACTION_COLORS, FACTION_ICONS } from '../../utils/constants'
import { hp_color } from '../../utils/formatters'
import styles from './SquadSection.module.css'

export function SquadSection({ companions }: { companions: Companion[] }) {
    return (
        <div className={styles.section}>
            <div className={styles.label}>Squad</div>
            <div className={styles.list}>
                {companions.map((c, i) => {
                    const icon = FACTION_ICONS[c.faction]
                    const factionName = FACTIONS[c.faction] ?? c.faction
                    const factionColor = FACTION_COLORS[c.faction] ?? '#4a9eff'
                    const color = hp_color(c.health)
                    return (
                        <div key={i} className={styles.row}>
                            {icon
                                ? <img className={styles.icon} src={icon} alt={factionName} />
                                : <span className={styles.iconPlaceholder} />
                            }
                            <div className={styles.identity}>
                                <span className={styles.companionName}>{c.name}</span>
                                <span className={styles.faction} style={{ color: factionColor }}>{factionName}</span>
                            </div>
                            <div className={styles.hp}>
                                <div className={styles.hpTrack}>
                                    <div className={styles.hpFill} style={{ width: `${c.health}%`, background: color }} />
                                </div>
                                <span className={styles.hpPct} style={{ color }}>{c.health}%</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
