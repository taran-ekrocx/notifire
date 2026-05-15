// lib/fetchers/aggregator.ts

import { detectOfficialSource } from '../ai/detectOfficialSource';

import {
  Article,
  Category,
  ALL_CATEGORIES,
  SocialPlatform,
} from '../types';

import { fetchRSSFeeds } from './rss';

import { RSS_SOURCES } from '../config/rss-sources';

import { deduplicate } from '../processors/deduplicator';

import { detectTrendSignals, EMPTY_TREND_SIGNALS } from './trendSignals';

export async function fetchAllSources(
  categoryParam: string,
  trendingOnly = false
): Promise<Article[]> {
  const targets: Category[] =
    categoryParam === 'all'
      ? ALL_CATEGORIES
      : ALL_CATEGORIES.includes(
          categoryParam as Category
        )
      ? [categoryParam as Category]
      : ALL_CATEGORIES;

  // FETCH RSS FEEDS
  const settled =
    await Promise.allSettled(
      targets.map((cat) =>
        fetchRSSFeeds(
          RSS_SOURCES[cat] ?? [],
          cat
        )
      )
    );

  const all: Article[] = [];

  for (const result of settled) {
    if (
      result.status ===
      'fulfilled'
    ) {
      all.push(...result.value);
    }
  }

  // REMOVE DUPLICATES
  const deduped =
    deduplicate(all);

  try {
    // ENRICH ARTICLES
    const enriched: Article[] =
      await Promise.all(
        deduped.map(
          async (article) => {
            /**
             * REAL TREND DETECTION
             * --------------------------------
             * Checks:
             * - Google
             * - Twitter/X
             * - Reddit
             */
            const trendSignals =
              await detectTrendSignals(
                {
                  title:
                    article.title,

                  description:
                    article.description,

                  category:
                    article.category,

                  publishedAt:
                    article.publishedAt,
                }
              );

            /**
             * OFFICIAL SOURCE DETECTION
             */
            const official =
              await detectOfficialSource(
                article.title,
                article.description ||
                  '',
                article.url
              );

            const activePlatforms: SocialPlatform[] = [];
            if ((trendSignals.trendSignals.twitter?.tweet_count || 0) > 0) activePlatforms.push('twitter');
            if ((trendSignals.trendSignals.reddit?.reddit_post_count || 0) > 0) activePlatforms.push('reddit');
            if ((trendSignals.trendSignals.google?.google_trend_score || 0) > 0) activePlatforms.push('google');

            return {
              ...article,

              // TRENDING
              isTrending:
                trendSignals.isTrending,

              trendSignals:
                trendSignals.trendSignals,

              socialBoost:
                trendSignals.trendSignals.google?.google_trend_score || 0,

              socialPlatforms:
                activePlatforms,

              // AUTHORIZATION
              authorized:
                official.authorized,

              officialSourceName:
                official.officialSourceName ||
                undefined,

              officialSourceUrl:
                official.officialSourceUrl ||
                undefined,

              officialReason:
                official.reason,
            };
          }
        )
      );

    /**
     * TRENDING TAB
     */
    if (trendingOnly) {
      return enriched
        .filter(
          (a) =>
            a.isTrending
        )
        .sort(
          (a, b) =>
            (b.trendSignals?.google?.google_trend_score || 0) -
            (a.trendSignals?.google?.google_trend_score || 0)
        );
    }

    /**
     * HOMEPAGE FEED
     */
    return enriched.sort(
      (a, b) =>
        new Date(
          b.publishedAt
        ).getTime() -
        new Date(
          a.publishedAt
        ).getTime()
    );
  } catch (err) {
    console.warn(
      '[Aggregator] Failed:',
      (err as Error).message
    );

    /**
     * FALLBACK MODE
     */
    return await Promise.all(
      deduped.map(
        async (article) => {
          const official =
            await detectOfficialSource(
              article.title,
              article.description ||
                '',
              article.url
            );

          return {
            ...article,

            // TRENDING
            isTrending: false,

            trendSignals: EMPTY_TREND_SIGNALS,

            socialBoost: 0,

            socialPlatforms: [],

            // AUTHORIZATION
            authorized:
              official.authorized,

            officialSourceName:
              official.officialSourceName ||
              undefined,

            officialSourceUrl:
              official.officialSourceUrl ||
              undefined,

            officialReason:
              official.reason,
          };
        }
      )
    );
  }
}
