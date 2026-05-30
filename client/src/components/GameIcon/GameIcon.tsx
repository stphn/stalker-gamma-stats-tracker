import type { CSSProperties } from 'react';
import { GAME_ICON_PATHS, type GameIconName } from '../../utils/gameIcons';

interface GameIconProps {
	name: GameIconName;
	size?: number;
	color?: string;
	className?: string;
	style?: CSSProperties;
	'aria-label'?: string;
}

export function GameIcon({ name, size = 16, color = 'currentColor', className, style, 'aria-label': ariaLabel }: GameIconProps) {
	return (
		<svg
			viewBox="0 0 512 512"
			width={size}
			height={size}
			fill={color}
			className={className}
			style={style}
			aria-label={ariaLabel}
			aria-hidden={ariaLabel ? undefined : true}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d={GAME_ICON_PATHS[name]} />
		</svg>
	);
}
