import { type ReactNode, useId } from 'react';
import styles from './Tooltip.module.css';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
	/** Content shown in the floating bubble. Accepts rich nodes, not just text. */
	content: ReactNode;
	/** The trigger element the tooltip describes. */
	children: ReactNode;
	/** Side the bubble appears on. Defaults to "top". */
	placement?: Placement;
	/** Allow the bubble to wrap onto multiple lines (caps width). */
	multiline?: boolean;
	/** Extra class on the bubble for per-use styling overrides. */
	className?: string;
}

/**
 * Generic HUD-styled tooltip. Shows on hover and keyboard focus, no deps.
 * Wrap any trigger:
 *   <Tooltip content="Connected"><StatusPill /></Tooltip>
 *   <Tooltip content={<RichBody />} placement="right" multiline>...</Tooltip>
 * If `content` is empty, the children render untouched.
 */
export function Tooltip({ content, children, placement = 'top', multiline = false, className }: TooltipProps) {
	const id = useId();

	if (content == null || content === '') return <>{children}</>;

	const bubbleClass = [styles.bubble, multiline && styles.multiline, className].filter(Boolean).join(' ');

	return (
		<span className={styles.wrap} tabIndex={0} aria-describedby={id} data-placement={placement}>
			{children}
			<span className={bubbleClass} role="tooltip" id={id}>
				{content}
			</span>
		</span>
	);
}
