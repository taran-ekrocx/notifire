// src/app/api/scrape/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { getDb } from '@/lib/db';
import { scrapeArticle } from '@/lib/fetchers/scrapeArticle';

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    if (!body.url) {
      return NextResponse.json(
        {
          success: false,

          error: 'URL is required',
        },
        {
          status: 400,
        }
      );
    }

    const result = await scrapeArticle(
      body.url
    );

    if (!result.success) {
      return NextResponse.json(
        result,
        {
          status: 422,
        }
      );
    }

    // SAVE SCRAPED DATA TO DB
    try {
      const db = await getDb();

      await db.article.upsert({
        where: {
          url: body.url,
        },

        create: {
          url: body.url,

          title: result.title,

          content: result.content,

          description:
            result.content.slice(
              0,
              300
            ),

          source: new URL(
            body.url
          ).hostname,

          publishedAt:
            new Date(),

          category: 'ai',

          tags: JSON.stringify(
            []
          ),

          // TRENDING
          isTrending: false,

          trendingOn:
            JSON.stringify([]),

          trendingCount: 0,

          // AUTH
          authorized: false,

          officialSourceName:
            null,

          officialSourceUrl:
            null,

          scrapedAt: new Date(),
        },

        update: {
          title: result.title,

          content: result.content,

          description:
            result.content.slice(
              0,
              300
            ),

          scrapedAt:
            new Date(),
        },
      });

      console.log(
        '[SCRAPE] Saved to DB:',
        body.url
      );
    } catch (dbError) {
      console.error(
        '[SCRAPE DB ERROR]',
        dbError
      );
    }

    return NextResponse.json({
      success: true,

      title: result.title,

      content: result.content,
    });
  } catch (error) {
    console.error(
      '[Scrape Route]',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}
