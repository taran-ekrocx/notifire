import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * Incomplete article filter:
 * - title, description, or url is empty string (all are non-nullable in schema)
 * - OR both description and content are absent (no useful readable content)
 */
const INCOMPLETE_WHERE = {
  OR: [
    { title: '' },
    { description: '' },
    { url: '' },
    {
      AND: [
        { description: '' },
        { OR: [{ content: null }, { content: '' }] },
      ],
    },
  ],
};

/**
 * POST: delete all incomplete articles.
 */
export async function POST() {
  const db = await getDb();

  const result = await db.article.deleteMany({ where: INCOMPLETE_WHERE });

  return NextResponse.json({
    deleted: result.count,
    message: `Removed ${result.count} incomplete article(s) (missing title, description, or url).`,
  });
}

/**
 * GET: preview how many articles would be deleted.
 */
export async function GET() {
  const db = await getDb();

  const count = await db.article.count({ where: INCOMPLETE_WHERE });

  return NextResponse.json({
    wouldDelete: count,
    message: `${count} article(s) are incomplete (missing title, description, or url).`,
  });
}
