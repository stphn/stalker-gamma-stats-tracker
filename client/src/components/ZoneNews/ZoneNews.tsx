import { BroadcastIcon } from '@phosphor-icons/react';
import type { NewsItem } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_run_datetime } from '../../utils/formatters';
import styles from './ZoneNews.module.css';

interface ZoneNewsProps {
	news: NewsItem[];
}

/** Curated feed of in-game events ("Zone News") captured by the mod. */
export function ZoneNews({ news }: ZoneNewsProps) {
	const { t } = useI18n();
	// Newest first (the mod prepends, but don't rely on it).
	const items = [...news].sort((a, b) => b.at - a.at);

	return (
		<section className={styles.root}>
			<div className={styles.head}>
				<span className={styles.heading}>
					<BroadcastIcon size={14} weight="fill" />
					{t('zonenews.title')}
				</span>
			</div>
			<ul className={styles.feed} aria-label={t('zonenews.title')}>
				{items.length === 0 && (
					<li className={styles.empty}>{t('zonenews.empty')}</li>
				)}
				{items.map((n, i) => (
					<li key={`${n.at}-${i}`} className={styles.item}>
						<time
							className={styles.time}
							dateTime={new Date(n.at * 1000).toISOString()}
							title={new Date(n.at * 1000).toLocaleString()}
						>
							{fmt_run_datetime(n.at)}
						</time>
						<span className={styles.text}>{n.text}</span>
						{n.key && n.key !== n.text && (
							<code className={styles.key} title="caption key">{n.key}</code>
						)}
					</li>
				))}
			</ul>
		</section>
	);
}
