// lib/fetchers/rss.ts
import Parser from 'rss-parser';
import { Article, Category } from '../types';
import { detectCategory, extractTags } from '../processors/categoryTagger';

type CustomItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  summary?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  'media:content'?: { $: { url: string } };
  'media:thumbnail'?: { $: { url: string } };
  enclosure?: { url?: string };
};

type CustomFeed = {
  title?: string;
  items: CustomItem[];
};

const parser = new Parser<CustomFeed, CustomItem>({
  timeout: 10000,
  headers: { 'User-Agent': 'NotifireBot/1.0 (News Aggregator; +https://notifire.in)' },
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure'],
  },
});

/**
 * 24-hour cutoff in milliseconds
 */
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Fetch ALL articles from the last 24 hours from the given RSS sources.
 * No artificial limit — every item published within the window is returned.
 */
export async function fetchRSSFeeds(
  sources: Array<{ url: string; authority: number }>,
  category: Category,
  _unusedLimit?: number // kept for API compat, ignored
): Promise<Article[]> {
  const results = await Promise.allSettled(
    sources.map(source => parser.parseURL(source.url))
  );

  const articles: Article[] = [];
  const cutoff = Date.now() - TWENTY_FOUR_HOURS;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const feedUrl = sources[i].url;
    const authority = sources[i].authority;

    if (result.status === 'rejected') {
      console.warn(`[RSS] Failed to fetch ${feedUrl}:`, result.reason?.message ?? result.reason);
      continue;
    }

    const feed = result.value;

    for (const item of feed.items) {
      const title = (item.title ?? '').trim();
      const link = (item.link ?? '').trim();
      const description = (item.contentSnippet ?? item.summary ?? '').trim();
      if (!title || !link || !description) continue;

      // Filter: only include articles published within the last 24 hours
      const pubDate = new Date(item.isoDate ?? item.pubDate ?? '');
      if (!isNaN(pubDate.getTime()) && pubDate.getTime() < cutoff) {
        continue; // Skip articles older than 24h
      }

      const combinedText = `${title} ${description}`;
      const detectedCategory = detectCategory(combinedText) ?? category;
      const tags = extractTags(combinedText);

      const imageUrl =
        item['media:content']?.$.url ??
        item['media:thumbnail']?.$.url ??
        item.enclosure?.url ??
        undefined;

      articles.push({
        id: '',
        title,
        url: link,
        description: description.slice(0, 300),
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        source: feed.title ?? new URL(feedUrl).hostname,
        imageUrl,
        author: item.creator,
        category: detectedCategory,
        tags,
      });
    }
  }

  return articles;
}
