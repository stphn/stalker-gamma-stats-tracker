import type { ActorInfo, Companion } from '../../types'
import { FACTIONS, FACTION_COLORS, FACTION_ICONS } from '../../utils/constants'
import { fmt_location, fmt_money, rank_label, rep_label, rep_color, hp_color } from '../../utils/formatters'
import styles from './DesktopProfileStrip.module.css'

interface DesktopProfileStripProps {
    actor: ActorInfo
    companions?: Companion[]
}

export function DesktopProfileStrip({ actor, companions }: DesktopProfileStripProps) {
    return (
        <div className={`dt-profile ${styles.root}`}>
            <div className={styles.factionLabel}>Stalker</div>
            <div className={styles.row}>
                <div className={styles.identity}>
                    {FACTION_ICONS[actor.faction] && (
                        <img className={styles.icon} src={FACTION_ICONS[actor.faction]} alt="" />
                    )}
                    <div>
                        <div className={styles.name}>{actor.name}</div>
                        <div className={styles.faction} style={{ color: FACTION_COLORS[actor.faction] ?? '#4a9eff' }}>
                            {FACTIONS[actor.faction] ?? actor.faction}
                        </div>
                    </div>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}><span className={styles.statLabel}>Rank</span><span className={styles.statValue}>{rank_label(actor.rank)}</span></div>
                    <div className={styles.stat}><span className={styles.statLabel}>Reputation</span><span className={styles.statValue} style={{ color: rep_color(actor.reputation) }}>{rep_label(actor.reputation)}</span></div>
                    <div className={styles.stat}><span className={styles.statLabel}>Location</span><span className={styles.statValue}>{fmt_location(actor.location, actor.location_name)}</span></div>
                    <div className={styles.stat}><span className={styles.statLabel}>Rubles</span><span className={styles.statValue} style={{ color: '#e8a838' }}>{fmt_money(actor.money)}</span></div>
                </div>
                {companions && companions.length > 0 && (
                    <div className={styles.companions}>
                        <div className={styles.companionsLabel}>Squad</div>
                        {companions.map((c, i) => {
                            const icon = FACTION_ICONS[c.faction]
                            const color = hp_color(c.health)
                            return (
                                <div key={i} className={styles.companionRow}>
                                    {icon
                                        ? <img className={styles.companionIcon} src={icon} alt="" />
                                        : <span className={styles.companionIcon} />
                                    }
                                    <span className={styles.companionName}>{c.name}</span>
                                    <div className={styles.companionHp}>
                                        <div className={styles.hpTrack}>
                                            <div className={styles.hpFill} style={{ width: `${c.health}%`, background: color }} />
                                        </div>
                                        <span style={{ color, fontSize: 10, fontFamily: 'var(--font-display)' }}>{c.health}%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
