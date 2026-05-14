// app/api/summarize/route.ts
// AI-powered article summarization
import { NextRequest, NextResponse } from 'next/server';
import { summarizeArticle, quickSummarize } from '@/lib/fetchers/summarizer';
import { scrapeArticle, extractMainContent } from '@/lib/fetchers/scraper';
import { getDb } from '@/lib/db';
import { getFromCache, setInCache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, title, description, source, scrapeFirst = false } = body;

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  const cacheKey = `summarize:${url}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cacheHit: true });
  }

  try {
    let content = '';
    let articleTitle = title || '';
    let articleSource = source || '';
    let articleDescription = description || '';

    // If scrapeFirst, fetch full content before summarizing
    if (scrapeFirst) {
      const scrapeResult = await scrapeArticle(url);
      if (scrapeResult.success) {
        const extracted = extractMainContent(scrapeResult);
        content = extracted.content;
        if (!articleTitle) articleTitle = extracted.title;
      }
    }

    // Also check DB for content
    const db = await getDb();
    if (!content) {
      const dbArticle = await db.article.findFirst({ where: { url } });
      if (dbArticle?.content) {
        content = dbArticle.content;
        articleTitle = articleTitle || dbArticle.title;
        articleSource = articleSource || dbArticle.source;
        articleDescription = articleDescription || dbArticle.description;
      }
    }

    // Generate summary
    const summary = content
      ? await summarizeArticle(articleTitle, articleDescription, content, articleSource)
      : await quickSummarize(articleTitle, articleDescription, articleSource);

    // Update database
    try {
      await db.article.updateMany({
        where: { url },
        data: {
          summary: summary.fullSummary,
          keyPoints: JSON.stringify(summary.keyPoints),
          sentiment: summary.sentiment,
          readTimeMin: summary.readTimeMinutes,
          summarizedAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.warn('[DB] Failed to update summary:', dbErr);
    }

    // Cache for 1 hour
    setInCache(cacheKey, summary, 3600);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[API /summarize] Error:', error);
    return NextResponse.json({
      fullSummary: description || 'Summary generation failed. Please try again.',
      keyPoints: ['AI analysis temporarily unavailable'],
      readTimeMinutes: 3,
      sentiment: 'neutral' as const,
      relatedTopics: ['Technology'],
    });
  }
}
