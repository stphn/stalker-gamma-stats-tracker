import {
	FACTIONS,
	FACTION_COLORS,
	FACTION_ICONS,
} from '../../utils/constants';
import styles from './FactionIcon.module.css';

const SIZES = {
	xs: { box: 17, img: 14 },
	sm: { box: 28, img: 23 },
	md: { box: 38, img: 31 },
	lg: { box: 72, img: 62 },
} as const;

interface FactionIconProps {
	faction: string;
	size?: keyof typeof SIZES;
	className?: string;
}

export function FactionIcon({
	faction,
	size = 'xs',
	className,
}: FactionIconProps) {
	const { box, img } = SIZES[size];
	const accent = FACTION_COLORS[faction] ?? '#8a8070';
	const icon = FACTION_ICONS[faction];
	const factionName = FACTIONS[faction] ?? faction;

	return (
		<div
			className={`${styles.root}${className ? ` ${className}` : ''}`}
			style={{
				width: box,
				height: box,
				borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
			}}
			aria-hidden="true"
		>
			{icon && <img src={icon} width={img} height={img} alt={factionName} />}
		</div>
	);
}
