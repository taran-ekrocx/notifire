import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * Deletes articles that have neither a description nor scraped content.
 * These are stub entries with no useful information for readers.
 */
export async function POST() {
  const db = await getDb();

  const result = await db.article.deleteMany({
    where: {
      AND: [
        { description: '' },
        { OR: [{ content: null }, { content: '' }] },
      ],
    },
  });

  return NextResponse.json({
    deleted: result.count,
    message: `Removed ${result.count} article(s) with no description and no content.`,
  });
}

/**
 * GET: preview how many articles would be deleted.
 */
export async function GET() {
  const db = await getDb();

  const count = await db.article.count({
    where: {
      AND: [
        { description: '' },
        { OR: [{ content: null }, { content: '' }] },
      ],
    },
  });

  return NextResponse.json({
    wouldDelete: count,
    message: `${count} article(s) have no description and no content.`,
  });
}
