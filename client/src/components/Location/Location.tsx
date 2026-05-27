import { fmt_location } from '../../utils/formatters'
import styles from './Location.module.css'

interface LocationProps {
    location: string
    locationName?: string
    gameTime?: { h: number; m: number }
    gameState: 'playing' | 'menu' | 'off'
}

const BADGES = {
    playing: { label: 'Live',        className: 'badgeLive' },
    menu:    { label: 'In Menu',     className: 'badgeMenu' },
    off:     { label: 'Not in Game', className: 'badgeOff'  },
}

export function Location({ location, locationName, gameTime, gameState }: LocationProps) {
    const name  = fmt_location(location, locationName)
    const clock = gameTime != null
        ? `${String(gameTime.h).padStart(2, '0')}:${String(gameTime.m).padStart(2, '0')}`
        : null
    const badge = BADGES[gameState]

    return (
        <div className={styles.root}>
            <div className={styles.name}>{name}</div>
            {clock && (
                <div className={styles.timeRow}>
                    <span className={styles.clock}>{clock}</span>
                    <span className={`${styles.badge} ${styles[badge.className]}`}>{badge.label}</span>
                </div>
            )}
        </div>
    )
}
