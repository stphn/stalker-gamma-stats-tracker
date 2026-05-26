import type { SessionBlock } from '../../types'
import { fmt_time, fmt_money, ordinal, fmt_location } from '../../utils/formatters'
import styles from './LastRunPanel.module.css'

export function LastRunPanel({ run, index }: { run: SessionBlock; index: number }) {
    const loc = run.death_location
        ? fmt_location(run.death_location, run.death_location_name)
        : null
    const label = index === 0 ? 'Last Stand' : `${ordinal(index + 1)} Last Stand`
    return (
        <section className={`panel ${styles.panel}`}>
            <div className="panel-head">
                <h2><span className="run-icon dead" style={{ fontSize: '0.85em', marginRight: '0.35em' }}>☠</span>{label}</h2>
                <div className="run-status">
                    <span className="run-time" style={{ color: 'var(--text-dim)' }}>{fmt_time(run.playtime)}</span>
                </div>
            </div>
            <div className={styles.body}>
                {run.kills.total > 0 && (
                    <div className={styles.stat}>
                        <span className={styles.value}>{run.kills.total}</span>
                        <span className={styles.label}>Kills</span>
                    </div>
                )}
                <div className={styles.stat}>
                    <span className={styles.value}>{run.tasks}</span>
                    <span className={styles.label}>Tasks</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.value}>{fmt_money(run.rubles_earned)}</span>
                    <span className={styles.label}>Earned</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.value}>{run.artifacts}</span>
                    <span className={styles.label}>Artifacts</span>
                </div>
                {loc && (
                    <div className={styles.stat}>
                        <span className={styles.value}>{loc}</span>
                        <span className={styles.label}>Died at</span>
                    </div>
                )}
            </div>
        </section>
    )
}
