import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const MIN_DESCRIPTION_LEN = 30;

/**
 * POST: delete all incomplete or stub articles:
 * - empty title, description, or url
 * - description shorter than MIN_DESCRIPTION_LEN (e.g. HN "Comments")
 * - both description and content absent
 */
export async function POST() {
  const db = await getDb();

  // Prisma filter for structurally empty fields
  const structural = await db.article.deleteMany({
    where: {
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
    },
  });

  // Raw SQL for short descriptions that Prisma can't length-filter natively
  const shortDescResult = await db.$executeRaw`
    DELETE FROM "Article"
    WHERE char_length(description) < ${MIN_DESCRIPTION_LEN}
  `;

  const total = structural.count + (shortDescResult as number);

  return NextResponse.json({
    deleted: total,
    message: `Removed ${total} incomplete article(s) (missing/stub title, description, or url).`,
  });
}

/**
 * GET: preview count of articles that would be deleted.
 */
export async function GET() {
  const db = await getDb();

  const structural = await db.article.count({
    where: {
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
    },
  });

  const shortDesc = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Article"
    WHERE char_length(description) < ${MIN_DESCRIPTION_LEN}
  `;
  const shortDescCount = Number(shortDesc[0].count);

  const total = structural + shortDescCount;

  return NextResponse.json({
    wouldDelete: total,
    message: `${total} article(s) are incomplete or have stub descriptions (< ${MIN_DESCRIPTION_LEN} chars).`,
  });
}
