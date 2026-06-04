import { PackageIcon } from '@phosphor-icons/react';
import type { NewsItem } from '../../types';
import { useI18n } from '../../i18n/I18nContext';
import styles from './LootFeed.module.css';

interface LootFeedProps {
	news: NewsItem[];
}

interface LootGroup {
	key: string;
	name: string;
	count: number;
	at: number;
	isArtifact: boolean;
}

/** Collapse the loot stream into per-item groups (newest-first) with counts. */
function groupLoot(news: NewsItem[]): LootGroup[] {
	const byKey = new Map<string, LootGroup>();
	for (const n of news) {
		if (n.kind !== 'loot') continue;
		const key = n.key ?? n.text;
		const g = byKey.get(key);
		if (g) {
			g.count += 1;
			if (n.at > g.at) g.at = n.at;
		} else {
			byKey.set(key, {
				key,
				name: n.text,
				count: 1,
				at: n.at,
				// Anomaly artifact sections are prefixed "af_".
				isArtifact: (n.key ?? '').startsWith('af_'),
			});
		}
	}
	return [...byKey.values()].sort((a, b) => b.at - a.at);
}

/** Stacked recent-loot rollup: each item grouped with a pickup count. */
export function LootFeed({ news }: LootFeedProps) {
	const { t } = useI18n();
	const groups = groupLoot(news);
	const total = groups.reduce((sum, g) => sum + g.count, 0);

	return (
		<section className={styles.root}>
			<div className={styles.head}>
				<span className={styles.heading}>
					<PackageIcon size={14} weight="fill" />
					{t('loot.title')}
				</span>
				{total > 0 && <span className={styles.total}>{total}</span>}
			</div>
			{groups.length === 0 ? (
				<div className={styles.empty}>{t('loot.empty')}</div>
			) : (
				<ul className={styles.list} aria-label={t('loot.title')}>
					{groups.map((g) => (
						<li
							key={g.key}
							className={`${styles.item} ${g.isArtifact ? styles.artifact : ''}`}
						>
							<span className={styles.count}>×{g.count}</span>
							<span className={styles.name}>{g.name}</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
