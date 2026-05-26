import { useRef } from 'react'
import styles from './StatCard.module.css'

export function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    const keyRef  = useRef(0)
    const prevRef = useRef(value)
    if (prevRef.current !== value) {
        prevRef.current = value
        keyRef.current++
    }
    return (
        <div className={styles.statCard}>
            <div key={keyRef.current} className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    )
}

export function StatGroup({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
    return (
        <div className={styles.statGroup}>
            <div className={styles.statGroupLabel} style={{ color }}>{label}</div>
            <div className={styles.statGrid}>{children}</div>
        </div>
    )
}
