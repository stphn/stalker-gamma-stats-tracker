import styles from './StatRow.module.css'

interface StatRowProps {
    label: string
    value: string | number
    labelColor?: string
    valueColor?: string
}

export function StatRow({ label, value, labelColor, valueColor }: StatRowProps) {
    return (
        <div className={styles.root}>
            <span className={styles.label} style={labelColor ? { color: labelColor } : undefined}>
                {label}
            </span>
            <span className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
                {value}
            </span>
        </div>
    )
}
