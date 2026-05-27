import type { ReactNode } from 'react'
import { useLocationImage } from '../../hooks/useLocationImage'
import styles from './Stage.module.css'

interface StageProps {
    location?: string
    left?: ReactNode
}

export function Stage({ location, left }: StageProps) {
    const src = useLocationImage(location)

    return (
        <div
            className={styles.stage}
            style={src ? { backgroundImage: `url(${src})` } : undefined}
        >
            <div className={styles.gradient} />
            <div className={styles.left}>{left}</div>
        </div>
    )
}
