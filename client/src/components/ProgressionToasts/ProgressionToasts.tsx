import { TrendDownIcon, TrendUpIcon, XIcon } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import type { ProgressionToast } from '../../hooks/useProgressionToasts';
import { useI18n } from '../../i18n/I18nContext';
import styles from './ProgressionToasts.module.css';

interface ProgressionToastsProps {
	toasts: ProgressionToast[];
	onDismiss: (id: number) => void;
}

// Newest on top, capped — older overflow is simply not rendered.
const MAX_VISIBLE = 4;
const AUTO_DISMISS_MS = 6000;

/** Picks the headline + sublabel i18n keys for a toast's kind/direction. */
function labelKeys(kind: 'rank' | 'rep', dir: 'up' | 'down') {
	const headline = dir === 'up' ? 'toast.promotion' : 'toast.demotion';
	const sub =
		kind === 'rank'
			? dir === 'up'
				? 'toast.rankUp'
				: 'toast.rankDown'
			: dir === 'up'
				? 'toast.repUp'
				: 'toast.repDown';
	return { headline, sub };
}

/** Stacked, auto- and manually-dismissable progression toasts (bottom-right). */
export function ProgressionToasts({
	toasts,
	onDismiss,
}: ProgressionToastsProps) {
	const { t } = useI18n();
	const onDismissRef = useRef(onDismiss);
	onDismissRef.current = onDismiss;

	// One auto-dismiss timer per toast id; cleared on unmount/dismiss.
	const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
	useEffect(() => {
		const timers = timersRef.current;
		for (const toast of toasts) {
			if (timers.has(toast.id)) continue;
			const handle = setTimeout(() => {
				timers.delete(toast.id);
				onDismissRef.current(toast.id);
			}, AUTO_DISMISS_MS);
			timers.set(toast.id, handle);
		}
		// Drop timers whose toast is gone (manual dismiss).
		const live = new Set(toasts.map((toast) => toast.id));
		for (const [id, handle] of timers) {
			if (!live.has(id)) {
				clearTimeout(handle);
				timers.delete(id);
			}
		}
	}, [toasts]);

	useEffect(() => {
		const timers = timersRef.current;
		return () => {
			for (const handle of timers.values()) clearTimeout(handle);
			timers.clear();
		};
	}, []);

	if (toasts.length === 0) return null;

	const visible = toasts.slice(0, MAX_VISIBLE);

	return (
		<div
			className={styles.root}
			aria-live="polite"
			aria-label={t('toast.promotion')}
		>
			{visible.map((toast) => {
				const { headline, sub } = labelKeys(toast.kind, toast.dir);
				const up = toast.dir === 'up';
				return (
					<div
						key={toast.id}
						className={`${styles.card} ${up ? styles.up : styles.down}`}
					>
						<span className={styles.icon} aria-hidden="true">
							{up ? (
								<TrendUpIcon size={20} weight="bold" />
							) : (
								<TrendDownIcon size={20} weight="bold" />
							)}
						</span>
						<div className={styles.body}>
							<span className={styles.headline}>{t(headline)}</span>
							<span className={styles.detail}>
								{t(sub)} · {t(toast.tierKey)}
							</span>
						</div>
						<button
							type="button"
							className={styles.close}
							onClick={() => onDismiss(toast.id)}
							aria-label={t('toast.dismiss')}
						>
							<XIcon size={14} weight="bold" />
						</button>
					</div>
				);
			})}
		</div>
	);
}
