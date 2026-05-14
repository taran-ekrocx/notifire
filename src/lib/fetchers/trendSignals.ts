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
  google: 10000,
};

/**
 * REAL trend detection
 * --------------------------------
 * Checks:
 * - Twitter/X
 * - Reddit
 * - Google Trends
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
    google,
  ] = await Promise.all([
    checkTwitterTrend(query),

    checkRedditTrend(query),

    checkGoogleTrend(query),
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

  // GOOGLE
  if (google.trending) {
    trendingOn.push('google');

    trendingCount += google.count;
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
 * GOOGLE TREND CHECK
 * --------------------------------
 * Uses Google Trends daily trending searches.
 * Google does not expose views/likes for a topic,
 * so `count` is parsed from the traffic bucket
 * returned by Trends, such as "20K+".
 */
async function checkGoogleTrend(
  query: string
): Promise<PlatformResult> {
  try {
    const url =
      'https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-330&geo=US&ns=15';

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },

      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        trending: false,

        count: 0,
      };
    }

    const raw =
      await response.text();

    const jsonStart =
      raw.indexOf('{');

    if (jsonStart === -1) {
      return {
        trending: false,

        count: 0,
      };
    }

    const data = JSON.parse(
      raw.slice(jsonStart)
    );

    const searches =
      data?.default
        ?.trendingSearchesDays?.flatMap(
          (day: {
            trendingSearches?: Array<{
              title?: {
                query?: string;
              };
              formattedTraffic?: string;
              relatedQueries?: Array<{
                query?: string;
              }>;
            }>;
          }) =>
            day.trendingSearches || []
        ) || [];

    const queryTokens =
      tokenize(query);

    let count = 0;

    for (const search of searches) {
      const title =
        search.title?.query || '';

      const related =
        search.relatedQueries
          ?.map((item) => item.query)
          .filter(Boolean)
          .join(' ') || '';

      const candidateTokens =
        tokenize(`${title} ${related}`);

      const isMatch =
        Array.from(queryTokens).some(
          (token) =>
            candidateTokens.has(
              token
            )
        );

      if (isMatch) {
        count += parseTrafficCount(
          search.formattedTraffic
        );
      }
    }

    return {
      trending:
        count >=
        TREND_THRESHOLD.google,

      count,
    };
  } catch {
    return {
      trending: false,

      count: 0,
    };
  }
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(
        (token) =>
          token.length > 2 &&
          ![
            'the',
            'and',
            'for',
            'with',
            'from',
            'that',
            'this',
            'into',
            'over',
          ].includes(token)
      )
  );
}

function parseTrafficCount(
  value?: string
) {
  if (!value) return 0;

  const normalized =
    value
      .replace(/,/g, '')
      .replace(/\+/g, '')
      .trim()
      .toUpperCase();

  const match =
    normalized.match(
      /([\d.]+)\s*([KMB])?/
    );

  if (!match) return 0;

  const amount =
    Number(match[1]);

  if (Number.isNaN(amount)) {
    return 0;
  }

  const multiplier =
    match[2] === 'B'
      ? 1_000_000_000
      : match[2] === 'M'
      ? 1_000_000
      : match[2] === 'K'
      ? 1_000
      : 1;

  return Math.round(
    amount * multiplier
  );
}
