// src/lib/fetchers/trendSignals.ts

export interface TrendSignal {
  isTrending: boolean;

  trendingOn: string[];

  trendingCount: number;
}

interface PlatformResult {
  trending: boolean;

  count: number;
}

const TREND_THRESHOLD = {
  twitter: 25,
  reddit: 250,
  hackernews: 50, // points + comments across top stories in last 48h
};

/**
 * REAL trend detection
 * --------------------------------
 * Checks:
 * - Twitter/X  (requires TWITTER_BEARER_TOKEN env var)
 * - Reddit     (public API, no auth)
 * - Hacker News via Algolia (public API, no auth)
 *
 * Note: Google Trends dailytrends endpoint was deprecated/removed.
 * Hacker News is used instead as it covers the same tech-news audience.
 */
export async function detectTrendSignals(
  article: {
    title: string;
    description?: string;
    tags?: string[];
  }
): Promise<TrendSignal> {
  const trendingOn: string[] = [];

  let trendingCount = 0;

  const query = buildTrendQuery(
    article.title,
    article.tags || []
  );

  // CHECK ALL PLATFORMS
  const [
    twitter,
    reddit,
    hackernews,
  ] = await Promise.all([
    checkTwitterTrend(query),

    checkRedditTrend(query),

    checkHackerNewsTrend(query),
  ]);

  // TWITTER/X
  if (twitter.trending) {
    trendingOn.push('twitter');

    trendingCount += twitter.count;
  }

  // REDDIT
  if (reddit.trending) {
    trendingOn.push('reddit');

    trendingCount += reddit.count;
  }

  // HACKER NEWS
  if (hackernews.trending) {
    trendingOn.push('hackernews');

    trendingCount += hackernews.count;
  }

  return {
    isTrending:
      trendingOn.length > 0,

    trendingOn,

    trendingCount,
  };
}

/**
 * BUILD SEARCH QUERY
 */
function buildTrendQuery(
  title: string,
  tags: string[]
) {
  const cleanedTitle =
    title
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .slice(0, 6)
      .join(' ');

  return `${cleanedTitle} ${tags
    .slice(0, 3)
    .join(' ')}`.trim();
}

/**
 * TWITTER/X TREND CHECK
 * --------------------------------
 * NOTE:
 * Official Twitter API is paid/restricted.
 *
 * Uses real Twitter/X public metrics when
 * TWITTER_BEARER_TOKEN is configured.
 */
async function checkTwitterTrend(
  query: string
): Promise<PlatformResult> {
  try {
    const bearerToken =
      process.env
        .TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      return {
        trending: false,

        count: 0,
      };
    }

    const url = new URL(
      'https://api.twitter.com/2/tweets/search/recent'
    );

    url.searchParams.set(
      'query',
      `${query} -is:retweet lang:en`
    );

    url.searchParams.set(
      'max_results',
      '25'
    );

    url.searchParams.set(
      'tweet.fields',
      'public_metrics'
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },

      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        trending: false,

        count: 0,
      };
    }

    const data =
      await response.json();

    const tweets =
      data?.data || [];

    const count =
      tweets.reduce(
        (
          total: number,
          tweet: {
            public_metrics?: {
              like_count?: number;
              retweet_count?: number;
              reply_count?: number;
              quote_count?: number;
              bookmark_count?: number;
              impression_count?: number;
            };
          }
        ) => {
          const metrics =
            tweet.public_metrics || {};

          const views =
            metrics.impression_count ||
            0;

          const engagements =
            (metrics.like_count || 0) +
            (metrics.retweet_count ||
              0) +
            (metrics.reply_count ||
              0) +
            (metrics.quote_count ||
              0) +
            (metrics.bookmark_count ||
              0);

          return total + views + engagements;
        },
        0
      );

    return {
      trending:
        count >=
        TREND_THRESHOLD.twitter,

      count,
    };
  } catch {
    return {
      trending: false,

      count: 0,
    };
  }
}

/**
 * REDDIT TREND CHECK
 * --------------------------------
 * Uses Reddit public search API.
 * Reddit does not expose post views publicly,
 * so count is the real visible activity:
 * score + comments.
 */
async function checkRedditTrend(
  query: string
): Promise<PlatformResult> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
      query
    )}&sort=top&t=day&limit=10`;

    const response = await fetch(
      url,
      {
        headers: {
          'User-Agent':
            'NotifierBot/1.0',
        },

        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return {
        trending: false,

        count: 0,
      };
    }

    const data =
      await response.json();

    const posts =
      data?.data?.children || [];

    if (!posts.length) {
      return {
        trending: false,

        count: 0,
      };
    }

    let score = 0;

    let comments = 0;

    for (const post of posts) {
      score +=
        post?.data?.score || 0;

      comments +=
        post?.data
          ?.num_comments || 0;
    }

    const total =
      score + comments;

    return {
      trending:
        total >=
        TREND_THRESHOLD.reddit,

      count: total,
    };
  } catch {
    return {
      trending: false,

      count: 0,
    };
  }
}

/**
 * HACKER NEWS TREND CHECK
 * --------------------------------
 * Uses the public Hacker News Algolia search API.
 * Searches for stories posted in the last 48 hours that match
 * the article query. Count = sum of (points + comments) across hits.
 * No API key required.
 *
 * Replaces the previous Google Trends dailytrends endpoint which
 * started returning 404 and is no longer functional from this server.
 */
async function checkHackerNewsTrend(
  query: string
): Promise<PlatformResult> {
  try {
    const since48h = Math.floor(Date.now() / 1000) - 48 * 60 * 60;

    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
      query
    )}&tags=story&numericFilters=created_at_i%3E${since48h}&hitsPerPage=20`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NotifireBot/1.0',
      },

      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        trending: false,

        count: 0,
      };
    }

    const data = await response.json();

    const hits: Array<{
      points?: number;
      num_comments?: number;
    }> = data?.hits || [];

    if (!hits.length) {
      return {
        trending: false,

        count: 0,
      };
    }

    const count = hits.reduce(
      (total, hit) =>
        total + (hit.points || 0) + (hit.num_comments || 0),
      0
    );

    return {
      trending: count >= TREND_THRESHOLD.hackernews,

      count,
    };
  } catch {
    return {
      trending: false,

      count: 0,
    };
  }
}

