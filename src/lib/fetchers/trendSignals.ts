// src/lib/fetchers/trendSignals.ts

import { getGeminiApiKey } from '../ai/geminiKey';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeminiTrendSignals {
  twitter: {
    tweet_count: number;
    retweet_count: number;
    hashtags: string[];
    mention_count: number;
  };
  reddit: {
    reddit_post_count: number;
    reddit_comment_count: number;
    reddit_upvote_count: number;
    reddit_engagement: number;
    subreddits: string[];
  };
  google: {
    google_trend_score: number;
    google_search_frequency_delta: number;
    related_queries: string[];
  };
  reasoning?: string;
}

export interface TrendSignal {
  isTrending: boolean;
  trendSignals: GeminiTrendSignals;
}

export const EMPTY_TREND_SIGNALS: GeminiTrendSignals = {
  twitter: { tweet_count: 0, retweet_count: 0, hashtags: [], mention_count: 0 },
  reddit: { reddit_post_count: 0, reddit_comment_count: 0, reddit_upvote_count: 0, reddit_engagement: 0, subreddits: [] },
  google: { google_trend_score: 0, google_search_frequency_delta: 0, related_queries: [] },
};

const SYSTEM_PROMPT =
  'You are a social media and search trend analyst. Given a news article, estimate its trending potential across Twitter/X, Reddit, and Google Search. Return ONLY valid JSON matching the schema below';

const OUTPUT_SCHEMA = `{
  "twitter": { "tweet_count": integer, "retweet_count": integer, "hashtags": [string], "mention_count": integer },
  "reddit": { "reddit_post_count": integer, "reddit_comment_count": integer, "reddit_upvote_count": integer, "reddit_engagement": integer, "subreddits": [string] },
  "google": { "google_trend_score": integer, "google_search_frequency_delta": float, "related_queries": [string] },
  "reasoning": string
}`;

export async function detectTrendSignals(article: {
  title: string;
  description?: string;
  category?: string;
  publishedAt?: string;
}): Promise<TrendSignal> {
  try {
    const input = {
      title: article.title,
      description: article.description || '',
      category: article.category || 'tech',
      published_at: article.publishedAt || new Date().toISOString(),
    };

    const userText = `${SYSTEM_PROMPT}\n\nOutput JSON Schema:\n${OUTPUT_SCHEMA}\n\nInput:\n${JSON.stringify(input)}`;

    const GEMINI_API_KEY = await getGeminiApiKey();
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { isTrending: false, trendSignals: EMPTY_TREND_SIGNALS };
    }

    const data = await response.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { isTrending: false, trendSignals: EMPTY_TREND_SIGNALS };
    }

    const signals: GeminiTrendSignals = JSON.parse(text);

    const isTrending =
      (signals.twitter?.tweet_count || 0) >= 50 ||
      (signals.reddit?.reddit_post_count || 0) >= 5 ||
      (signals.google?.google_trend_score || 0) >= 30;

    return { isTrending, trendSignals: signals };
  } catch {
    return { isTrending: false, trendSignals: EMPTY_TREND_SIGNALS };
  }
}
