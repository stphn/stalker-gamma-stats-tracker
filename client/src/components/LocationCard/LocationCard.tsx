import { useState, useEffect } from 'react'
import { fmt_location, day_period } from '../../utils/formatters'
import styles from './LocationCard.module.css'

interface LocationCardProps {
    location: string
    locationName?: string
    gameTime?: { h: number; m: number }
    large?: boolean
    className?: string
}

export function LocationCard({ location, locationName, gameTime, large, className }: LocationCardProps) {
    const [src, setSrc] = useState<string | null>(null)
    useEffect(() => {
        setSrc(null)
        const found: string[] = []
        let done = 0
        const total = 5
        for (let i = 1; i <= total; i++) {
            const s = `/locations/${location}/${location}_${String(i).padStart(2, '0')}.png`
            const img = new Image()
            const finish = () => { if (++done === total) { const f = found.filter(Boolean); setSrc(f[Math.floor(Math.random() * f.length)] ?? null) } }
            img.onload  = () => { found[i - 1] = s; finish() }
            img.onerror = finish
            img.src = s
        }
    }, [location])

    const name = fmt_location(location, locationName)
    const period = gameTime != null ? day_period(gameTime.h) : null
    const clock = gameTime != null
        ? `${String(gameTime.h).padStart(2, '0')}:${String(gameTime.m).padStart(2, '0')}`
        : null

    return (
        <div className={`${styles.card}${className ? ` ${className}` : ''}`}>
            {src && <img className={styles.img} src={src} alt="" />}
            <div className={styles.overlay}>
                <div className={`${styles.name}${large ? ` ${styles.nameLarge}` : ''}`}>{name}</div>
                {clock && period && (
                    <div className={styles.time}>
                        <span className={`${styles.clock}${large ? ` ${styles.clockLarge}` : ''}`}>{clock}</span>
                        <span className={styles.period} style={{ color: period.color }}>{period.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
