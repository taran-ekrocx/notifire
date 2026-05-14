// lib/processors/deduplicator.ts
import { createHash } from 'crypto';
import { Article } from '../types';

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 3));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function deduplicate(articles: Article[]): Article[] {
  const seen: Article[] = [];

  for (const article of articles) {
    if (!article.title || !article.url) continue;
    const titleTokens = tokenize(article.title);

    const isDuplicate = seen.some(existing => {
      if (existing.url === article.url) return true;
      return jaccardSimilarity(titleTokens, tokenize(existing.title)) > 0.7;
    });

    if (!isDuplicate) {
      seen.push({
        ...article,
        id: article.id || createHash('sha256').update(article.url).digest('hex').slice(0, 12),
      });
    }
  }

  return seen;
}
