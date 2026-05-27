import type { Companion } from '../../types'
import { FACTIONS, FACTION_COLORS } from '../../utils/constants'
import { hp_color } from '../../utils/formatters'
import styles from './Companions.module.css'

interface CompanionsProps {
    companions: Companion[]
}

export function Companions({ companions }: CompanionsProps) {
    return (
        <div className={styles.root}>
            <div className={styles.label}>Squad</div>
            <div className={styles.grid}>
                {companions.map((c, i) => {
                    const factionColor = FACTION_COLORS[c.faction] ?? '#e8c46a'
                    const factionName  = FACTIONS[c.faction] ?? c.faction
                    const hpColor      = hp_color(c.health)
                    return (
                        <div key={i} className={styles.card}>
                            <div className={styles.name}>{c.name}</div>
                            <div className={styles.bottom}>
                                <span className={styles.faction} style={{ color: factionColor }}>{factionName}</span>
                                <div className={styles.hpTrack}>
                                    <div className={styles.hpFill} style={{ width: `${c.health}%`, background: hpColor }} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
