import { BroadcastIcon } from '@phosphor-icons/react';
import type { NewsItem } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import { fmt_run_datetime } from '../../utils/formatters';
import { classifyNews, CATEGORY_META, type NewsCategory } from '../../utils/newsCategory';
import styles from './ZoneNews.module.css';

interface ZoneNewsProps {
	news: NewsItem[];
}

interface TickerEntry {
	category: NewsCategory;
	text: string;
	at: number;
	count: number;
}

/**
 * Collapses the raw stream into ticker entries: drops categories that opt out of
 * the ticker (noise), merges duplicates (same category+text) into one entry with
 * a count and the newest timestamp, then sorts newest-first.
 */
function toTickerEntries(news: NewsItem[]): TickerEntry[] {
	const byKey = new Map<string, TickerEntry>();
	for (const n of news) {
		const category = classifyNews(n);
		if (!CATEGORY_META[category].tickerVisible) continue;
		const key = `${category}::${n.text}`;
		const existing = byKey.get(key);
		if (existing) {
			existing.count += 1;
			if (n.at > existing.at) existing.at = n.at;
		} else {
			byKey.set(key, { category, text: n.text, at: n.at, count: 1 });
		}
	}
	return [...byKey.values()].sort((a, b) => b.at - a.at);
}

/** Ambient scrolling ticker of in-game events ("Zone News"). */
export function ZoneNews({ news }: ZoneNewsProps) {
	const { t } = useI18n();
	const entries = toTickerEntries(news);

	return (
		<section className={styles.root}>
			<span className={styles.heading}>
				<BroadcastIcon size={14} weight="fill" />
				{t('zonenews.title')}
			</span>
			{entries.length === 0 ? (
				<div className={styles.empty}>{t('zonenews.empty')}</div>
			) : (
				<div className={styles.ticker} aria-label={t('zonenews.title')}>
					{/* Rendered twice for a seamless marquee loop. */}
					<div className={styles.track}>
						{[0, 1].map((copy) => (
							<div className={styles.group} key={copy} aria-hidden={copy === 1}>
								{entries.map((e, i) => (
									<span className={styles.item} key={`${copy}-${i}`}>
										<span
											className={styles.dot}
											style={{ background: CATEGORY_META[e.category].color }}
										/>
										<time
											className={styles.time}
											dateTime={new Date(e.at * 1000).toISOString()}
										>
											{fmt_run_datetime(e.at)}
										</time>
										<span className={styles.text}>{e.text}</span>
										{e.count > 1 && <span className={styles.count}>×{e.count}</span>}
										<span className={styles.sep} aria-hidden="true">✦</span>
									</span>
								))}
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
