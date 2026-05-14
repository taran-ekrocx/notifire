// src/app/api/scrape/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import * as cheerio from 'cheerio';

import { getDb } from '@/lib/db';

async function scrapeUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },

      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed with status ${response.status}`
      );
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    const title =
      $('title').text() ||
      $('h1').first().text() ||
      'Untitled Article';

    const paragraphs = $('p')
      .map((_, el) =>
        $(el).text().trim()
      )
      .get()
      .filter(Boolean);

    const content = paragraphs
      .join('\n\n')
      .slice(0, 15000);

    return {
      success: true,
      title,
      content,
    };
  } catch (error) {
    console.error(
      '[Scrape]',
      error
    );

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : 'Scraping failed',
    };
  }
}

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

    const result = await scrapeUrl(
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
