import { useState } from 'react';
import { InfoIcon, XIcon } from '@phosphor-icons/react';
import { useI18n } from '../../i18n/I18nContext';
import styles from './AllTimeNote.module.css';

// Open/closed state for the All-Time explainer, persisted like the other
// tracker_* UI toggles (see GameAchievements). Defaults open on first visit.
const LS_KEY = 'tracker_alltime_note_open';
function load(): boolean {
	try {
		const v = localStorage.getItem(LS_KEY);
		return v == null ? true : v !== 'false';
	} catch {
		return true;
	}
}
function save(open: boolean) {
	try {
		localStorage.setItem(LS_KEY, String(open));
	} catch {
		/* private mode / storage disabled — non-fatal */
	}
}

/**
 * Dismissable explainer for the cross-save All-Time totals. Collapses to a small
 * ⓘ button that reopens it; the open/closed state persists across reloads.
 */
export function AllTimeNote() {
	const { t } = useI18n();
	const [open, setOpen] = useState(load);

	const set = (next: boolean) => {
		setOpen(next);
		save(next);
	};

	if (!open) {
		return (
			<div className={styles.collapsed}>
				<button
					type="button"
					className={styles.reopen}
					onClick={() => set(true)}
					aria-label={t('alltime.note.show')}
				>
					<InfoIcon size={16} weight="bold" />
				</button>
			</div>
		);
	}

	return (
		<div className={styles.note} role="note">
			<InfoIcon className={styles.icon} size={18} weight="fill" aria-hidden="true" />
			<div className={styles.body}>
				<span className={styles.title}>{t('alltime.note.title')}</span>
				<p className={styles.text}>{t('alltime.note.body')}</p>
			</div>
			<button
				type="button"
				className={styles.close}
				onClick={() => set(false)}
				aria-label={t('alltime.note.dismiss')}
			>
				<XIcon size={14} weight="bold" />
			</button>
		</div>
	);
}
