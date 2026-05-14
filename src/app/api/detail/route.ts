// app/api/detail/route.ts
// Get detailed article with AI analysis (scrape + summarize on demand)
import { NextRequest, NextResponse } from 'next/server';
import { scrapeArticle } from '@/lib/fetchers/scraper';
import { summarizeArticle } from '@/lib/fetchers/summarizer';
import { getDb } from '@/lib/db';
import { getFromCache, setInCache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  const { title, url, description, source } = await req.json();
  if (!title || !url) {
    return NextResponse.json({ error: 'title and url required' }, { status: 400 });
  }

  const cacheKey = `detail:${url}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const db = await getDb();

    // 1. Check if article already has summary in DB
    const existing = await db.article.findFirst({ where: { url } });

    if (existing?.summary && existing.summarizedAt) {
      const detail = {
        fullSummary: existing.summary,
        keyPoints: JSON.parse(existing.keyPoints || '[]'),
        readTimeMinutes: existing.readTimeMin,
        sentiment: existing.sentiment as 'positive' | 'neutral' | 'negative',
        relatedTopics: JSON.parse(existing.tags || '[]').slice(0, 4),
      };

      setInCache(cacheKey, detail, 3600);
      return NextResponse.json(detail, { headers: { 'X-Cache': 'DB-HIT' } });
    }

    // 2. Scrape the article for full content
    let content = existing?.content || '';
    if (!content) {
      const scrapeResult = await scrapeArticle(url);
      if (scrapeResult.success) {
        const extracted = await scrapeArticle(url);
        content = extracted.content;

        // Update DB with scraped content
        try {
          if (existing) {
            await db.article.update({
              where: { id: existing.id },
              data: {
                content,
                scrapedAt: new Date(),
                readTimeMin: extracted.estimatedReadTime,
              },
            });
          }
        } catch {}
      }
    }

    // 3. Generate AI summary
    const summary = await summarizeArticle(
      title,
      description || existing?.description || '',
      content,
      source || existing?.source || ''
    );

    // 4. Update database
    try {
      if (existing) {
        await db.article.update({
          where: { id: existing.id },
          data: {
            content: content || undefined,
            summary: summary.fullSummary,
            keyPoints: JSON.stringify(summary.keyPoints),
            sentiment: summary.sentiment,
            readTimeMin: summary.readTimeMinutes,
            summarizedAt: new Date(),
          },
        });
      }
    } catch (dbErr) {
      console.warn('[DB] Failed to update detail:', dbErr);
    }

    // Cache for 1 hour
    setInCache(cacheKey, summary, 3600);

    return NextResponse.json(summary, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    console.error('[detail] Error:', err);
    const fallback = {
      fullSummary: description
        ? `${description} Read the full article at ${source} for complete details.`
        : `This article from ${source} covers recent developments. Visit the source for the full story.`,
      keyPoints: description
        ? [
            description.split('.')[0]?.trim() || 'Read the full article for details',
            `Published by ${source}`,
            'Click "Read Full Article" for the complete story',
            'AI summary temporarily unavailable',
          ]
        : [
            `Published by ${source}`,
            'Click "Read Full Article" for the complete story',
            'AI enrichment in progress',
            'See source link for details',
          ],
      readTimeMinutes: 3,
      sentiment: 'neutral' as const,
      relatedTopics: ['Technology', 'Industry News', 'Latest Updates'],
    };
    return NextResponse.json(fallback);
  }
}
