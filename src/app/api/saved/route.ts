// app/api/saved/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET saved articles
export async function GET() {
  try {
    const db = await getDb();
    const saved = await db.savedArticle.findMany({
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });

    const articles = saved.map(s => ({
      id: s.article.id,
      title: s.article.title,
      url: s.article.url,
      description: s.article.description,
      publishedAt: s.article.publishedAt.toISOString(),
      source: s.article.source,
      imageUrl: s.article.imageUrl,
      aiImageUrl: s.article.aiImageUrl,
      author: s.article.author,
      category: s.article.category,
      tags: JSON.parse(s.article.tags || '[]'),
      summary: s.article.summary,
      keyPoints: JSON.parse(s.article.keyPoints || '[]'),
      savedAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('[API /saved] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved articles' }, { status: 500 });
  }
}

// POST save an article
export async function POST(req: NextRequest) {
  const { articleId } = await req.json();

  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }

  try {
    const db = await getDb();

    // Check if article exists
    const article = await db.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if already saved
    const existing = await db.savedArticle.findFirst({
      where: { articleId },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already saved', saved: true });
    }

    const saved = await db.savedArticle.create({
      data: { articleId },
    });

    return NextResponse.json({ saved: true, id: saved.id });
  } catch (error) {
    console.error('[API /saved] POST Error:', error);
    return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
  }
}

// DELETE unsave an article
export async function DELETE(req: NextRequest) {
  const { articleId } = await req.json();

  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }

  try {
    const db = await getDb();
    await db.savedArticle.deleteMany({
      where: { articleId },
    });

    return NextResponse.json({ unsaved: true });
  } catch (error) {
    console.error('[API /saved] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to unsave article' }, { status: 500 });
  }
}
