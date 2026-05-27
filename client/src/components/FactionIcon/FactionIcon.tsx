import { FACTION_BG_COLORS, FACTION_ICONS } from '../../utils/constants'
import styles from './FactionIcon.module.css'

const SIZES = {
    xs: { box: 12, img: 10 },
    sm: { box: 24, img: 20 },
    md: { box: 32, img: 26 },
    lg: { box: 64, img: 54 },
} as const

interface FactionIconProps {
    faction: string
    size?: keyof typeof SIZES
    className?: string
}

export function FactionIcon({ faction, size = 'xs', className }: FactionIconProps) {
    const { box, img } = SIZES[size]
    const bg   = FACTION_BG_COLORS[faction] ?? '#1c1c1c'
    const icon = FACTION_ICONS[faction]

    return (
        <div
            className={`${styles.root}${className ? ` ${className}` : ''}`}
            style={{ width: box, height: box, background: bg }}
        >
            {icon && <img src={icon} width={img} height={img} alt="" />}
        </div>
    )
}
