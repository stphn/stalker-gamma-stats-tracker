import type { GameAchievements } from '../../types'
import styles from './Achievements.module.css'

export function Achievements({ achieved }: { achieved: Record<string, { name: string; desc: string; at: number }> }) {
    const list = Object.values(achieved).sort((a, b) => a.at - b.at)
    return (
        <section className="panel">
            <h2>Tracker Achievements <span className={styles.achCount}>{list.length}</span></h2>
            {list.length === 0
                ? <p className="muted">None unlocked yet.</p>
                : <div className={styles.achList}>
                    {list.map(a => (
                        <div key={a.name} className={styles.achItem}>
                            <span className={styles.achName}>{a.name}</span>
                            <span className={styles.achDesc}>{a.desc}</span>
                        </div>
                    ))}
                  </div>
            }
        </section>
    )
}

export function GameAchievementsPanel({ ga }: { ga: GameAchievements }) {
    const ids = Object.keys(ga.unlocked).sort()
    return (
        <section className="panel">
            <h2>
                In-Game Achievements
                <span className={styles.achCount}>{ga.earned}/{ga.total}</span>
            </h2>
            {ids.length === 0
                ? <p className="muted">None unlocked yet.</p>
                : <div className={styles.achList}>
                    {ids.map(id => (
                        <div key={id} className={styles.achItem}>
                            <span className={styles.achName}>{id.replace(/_/g, ' ')}</span>
                        </div>
                    ))}
                  </div>
            }
        </section>
    )
}
