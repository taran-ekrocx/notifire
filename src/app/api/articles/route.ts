import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Article, Category } from '@/lib/types';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';

  try {
    const db = await getDb();
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS);

    const articles = await db.article.findMany({
      where: {
        publishedAt: { gte: cutoff },
        ...(category !== 'all' ? { category } : {}),
      },
      orderBy: { publishedAt: 'desc' },
    });

    const mapped: Article[] = articles.map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      description: a.description,
      publishedAt: a.publishedAt.toISOString(),
      source: a.source,
      imageUrl: a.imageUrl ?? undefined,
      aiImageUrl: a.aiImageUrl ?? undefined,
      author: a.author ?? undefined,
      category: a.category as Category,
      tags: JSON.parse(a.tags || '[]'),
      content: a.content ?? undefined,
      summary: a.summary ?? undefined,
      keyPoints: JSON.parse(a.keyPoints || '[]'),
      isTrending: a.isTrending,
      trendingOn: JSON.parse(a.trendingOn || '[]'),
      trendingCount: a.trendingCount,
      authorized: a.authorized,
      officialSourceName: a.officialSourceName ?? undefined,
      officialSourceUrl: a.officialSourceUrl ?? undefined,
      readTimeMin: a.readTimeMin,
      sentiment: a.sentiment as 'positive' | 'neutral' | 'negative',
      scrapedAt: a.scrapedAt?.toISOString(),
    }));

    return NextResponse.json({
      articles: mapped,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[articles] DB read failed:', err);
    return NextResponse.json(
      { articles: [], error: 'Failed to read articles from database' },
      { status: 500 }
    );
  }
}
