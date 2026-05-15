// app/api/news/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { fetchAllSources } from '@/lib/fetchers/aggregator';

import {
  getFromCache,
  setInCache,
} from '@/lib/cache';

import { Article } from '@/lib/types';

import { getDb } from '@/lib/db';

import { generateArticleImage } from '@/lib/fetchers/imageGenerator';

import { scrapeArticle } from '@/lib/fetchers/scrapeArticle';

export const revalidate = 300;

const TWENTY_FOUR_HOURS =
  24 * 60 * 60 * 1000;

export async function GET(
  req: NextRequest
) {
  const category =
    req.nextUrl.searchParams.get(
      'category'
    ) ?? 'all';

  const trendingOnly =
    req.nextUrl.searchParams.get(
      'trending'
    ) === 'true';

  const page = parseInt(
    req.nextUrl.searchParams.get(
      'page'
    ) ?? '1'
  );

  const limit = parseInt(
    req.nextUrl.searchParams.get(
      'limit'
    ) ?? '0'
  );

  const withImages =
    req.nextUrl.searchParams.get(
      'withImages'
    ) === 'true';

  const refresh =
    req.nextUrl.searchParams.get(
      'refresh'
    ) === 'true';

  const since =
    req.nextUrl.searchParams.get(
      'since'
    );

  const cacheKey = `news:${category}:24h`;

  // CACHE HIT
  if (!refresh) {
    const cached =
      getFromCache<Article[]>(
        cacheKey
      );

    if (cached) {
      const filtered =
        applySinceFilter(
          cached,
          since
        );

      const sliced =
        applyPagination(
          filtered,
          page,
          limit
        );

      return NextResponse.json(
        {
          articles: sliced,

          total: filtered.length,

          page,

          cacheHit: true,

          lastUpdated:
            new Date().toISOString(),
        },
        {
          headers: {
            'X-Cache': 'HIT',
          },
        }
      );
    }
  }

  try {
    // FETCH RSS
    const articles =
      await fetchAllSources(
        category,
        trendingOnly
      );

    // FILTER 24H
    const cutoff =
      Date.now() -
      TWENTY_FOUR_HOURS;

    const recent = articles
      .filter((a) => {
        const pubTime = new Date(
          a.publishedAt
        ).getTime();

        return (
          !isNaN(pubTime) &&
          pubTime >= cutoff
        );
      })
      .sort(
        (a, b) =>
          new Date(
            b.publishedAt
          ).getTime() -
          new Date(
            a.publishedAt
          ).getTime()
      );

    // SCRAPE FULL ARTICLES
    const scrapedArticles =
      await enrichWithScrapedContent(
        recent
      );

    // SAVE TO DATABASE
    await persistArticles(
      scrapedArticles
    );

    // PURGE THIN ARTICLES
    purgeArticlesWithoutContent();

    // AI IMAGES
    if (withImages) {
      const topArticles =
        scrapedArticles
          .filter(
            (a) =>
              a.isTrending &&
              (a.trendSignals?.google?.google_trend_score || 0) > 60
          )
          .slice(0, 5);

      generateImagesInBackground(
        topArticles
      );
    }

    // AI IMAGE ENRICH
    const enriched =
      await enrichWithAiImages(
        scrapedArticles
      );

    // CACHE
    setInCache(
      cacheKey,
      enriched,
      300
    );

    // FILTER
    const filtered =
      applySinceFilter(
        enriched,
        since
      );

    const sliced =
      applyPagination(
        filtered,
        page,
        limit
      );

    return NextResponse.json(
      {
        articles: sliced,

        total: filtered.length,

        page,

        cacheHit: false,

        lastUpdated:
          new Date().toISOString(),
      },
      {
        headers: {
          'X-Cache': 'MISS',

          'Cache-Control':
            'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error(
      '[API /news] Failed:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch news',
      },
      {
        status: 500,
      }
    );
  }
}

function applySinceFilter(
  articles: Article[],
  since?: string | null
): Article[] {
  if (!since) return articles;

  const sinceTime = new Date(
    since
  ).getTime();

  if (isNaN(sinceTime))
    return articles;

  return articles.filter(
    (a) =>
      new Date(
        a.publishedAt
      ).getTime() > sinceTime
  );
}

function applyPagination(
  articles: Article[],
  page: number,
  limit: number
): Article[] {
  if (limit <= 0)
    return articles;

  return articles.slice(
    (page - 1) * limit,
    page * limit
  );
}

// SCRAPE ARTICLES
async function enrichWithScrapedContent(
  articles: Article[]
): Promise<Article[]> {
  const db = await getDb();

  return Promise.all(
    articles.map(
      async (article) => {
        try {
          // CHECK EXISTING
          const existing =
            await db.article.findFirst(
              {
                where: {
                  url: article.url,
                },

                select: {
                  content: true,
                },
              }
            );

          // USE EXISTING
          if (
            existing?.content
          ) {
            return {
              ...article,

              content:
                existing.content,
            };
          }

          // SCRAPE NEW
          const scraped =
            await scrapeArticle(
              article.url
            );

          return {
            ...article,

            content:
              scraped.success
                ? scraped.content
                : null,

            scrapedAt:
              scraped.success
                ? new Date().toISOString()
                : null,
          };
        } catch (err) {
          console.warn(
            '[SCRAPE FAILED]',
            article.title
          );

          return article;
        }
      }
    )
  );
}

// SAVE ARTICLES
async function persistArticles(
  articles: Article[]
) {
  try {
    const db = await getDb();

    for (const article of articles) {
      try {
        await db.article.upsert({
          where: {
            url: article.url,
          },

          create: {
            title:
              article.title,

            url: article.url,

            description:
              article.description,

            imageUrl:
              article.imageUrl,

            aiImageUrl:
              article.aiImageUrl,

            source:
              article.source,

            author:
              article.author,

            publishedAt:
              new Date(
                article.publishedAt
              ),

            category:
              article.category,

            tags: JSON.stringify(
              article.tags || []
            ),

            content:
              article.content,

            summary:
              article.summary,

            keyPoints:
              JSON.stringify(
                article.keyPoints ||
                  []
              ),

            // TRENDING
            isTrending:
              article.isTrending ||
              false,

            trendSignals:
              JSON.stringify(
                article.trendSignals ||
                  {}
              ),

            // AUTHORIZATION
            authorized:
              article.authorized ||
              false,

            officialSourceName:
              article.officialSourceName,

            officialSourceUrl:
              article.officialSourceUrl,

            authConfidence:
              article.authConfidence ?? null,

            authCheckedAt:
              article.authCheckedAt
                ? new Date(article.authCheckedAt)
                : null,

            authFlags:
              JSON.stringify(article.authFlags || []),

            authReasoning:
              article.authReasoning ?? null,

            scrapedAt:
              article.scrapedAt
                ? new Date(
                    article.scrapedAt
                  )
                : null,
          },

          update: {
            title:
              article.title,

            description:
              article.description,

            imageUrl:
              article.imageUrl,

            aiImageUrl:
              article.aiImageUrl,

            author:
              article.author,

            tags: JSON.stringify(
              article.tags || []
            ),

            content:
              article.content,

            // TRENDING
            isTrending:
              article.isTrending ||
              false,

            trendSignals:
              JSON.stringify(
                article.trendSignals ||
                  {}
              ),

            // GEMINI AI AUTHORIZATION
            authorized:
              article.authorized ||
              false,

            officialSourceName:
              article.officialSourceName,

            officialSourceUrl:
              article.officialSourceUrl,

            authConfidence:
              article.authConfidence ?? null,

            authCheckedAt:
              article.authCheckedAt
                ? new Date(article.authCheckedAt)
                : null,

            authFlags:
              JSON.stringify(article.authFlags || []),

            authReasoning:
              article.authReasoning ?? null,

            scrapedAt:
              article.scrapedAt
                ? new Date(
                    article.scrapedAt
                  )
                : null,
          },
        });
      } catch (err) {
        console.error(
          '[DB ARTICLE SAVE ERROR]',
          err
        );
      }
    }
  } catch (err) {
    console.warn(
      '[DB] Persist failed:',
      (err as Error).message
    );
  }
}

// AI IMAGE ENRICH
async function enrichWithAiImages(
  articles: Article[]
): Promise<Article[]> {
  try {
    const db = await getDb();

    const enriched = [];

    for (const article of articles) {
      try {
        const dbArticle =
          await db.article.findFirst(
            {
              where: {
                url: article.url,
              },

              select: {
                aiImageUrl: true,
              },
            }
          );

        enriched.push({
          ...article,

          aiImageUrl:
            dbArticle?.aiImageUrl ||
            undefined,
        });
      } catch {
        enriched.push(article);
      }
    }

    return enriched;
  } catch {
    return articles;
  }
}

// PURGE ARTICLES WITH NO DESCRIPTION AND NO CONTENT
function purgeArticlesWithoutContent() {
  setTimeout(async () => {
    try {
      const db = await getDb();
      const result = await db.article.deleteMany({
        where: {
          AND: [
            { description: '' },
            { OR: [{ content: null }, { content: '' }] },
          ],
        },
      });
      if (result.count > 0) {
        console.log(`[Cleanup] Purged ${result.count} article(s) with no description and no content.`);
      }
    } catch (err) {
      console.warn('[Cleanup] Failed to purge thin articles:', err);
    }
  }, 0);
}

// AI IMAGE GENERATION
function generateImagesInBackground(
  articles: Article[]
) {
  setTimeout(async () => {
    try {
      const db = await getDb();

      for (const article of articles) {
        try {
          const existing =
            await db.article.findFirst(
              {
                where: {
                  url: article.url,
                },

                select: {
                  aiImageUrl: true,
                },
              }
            );

          if (
            existing?.aiImageUrl
          ) {
            continue;
          }

          const imagePath =
            await generateArticleImage(
              article.title,
              article.description,
              article.category,
              article.tags
            );

          if (imagePath) {
            await db.article.updateMany(
              {
                where: {
                  url: article.url,
                },

                data: {
                  aiImageUrl:
                    imagePath,
                },
              }
            );
          }

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                2000
              )
          );
        } catch (err) {
          console.warn(
            '[IMAGE GEN FAILED]',
            err
          );
        }
      }
    } catch (err) {
      console.warn(
        '[IMAGE TASK FAILED]',
        err
      );
    }
  }, 1000);
}
