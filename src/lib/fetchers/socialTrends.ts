// src/lib/fetchers/socialTrends.ts

import { Article } from '../types';

export interface SocialTrendTopic {
  keyword: string;
  platform: 'google' | 'reddit' | 'twitter';
  score: number;
}

export interface SocialTrendMatch {
  articleId: string;
  score: number;
  matchedTopics: string[];
}

const GOOGLE_TRENDS = [
  'openai',
  'chatgpt',
  'gemini',
  'claude',
  'ai agents',
  'tesla',
  'nvidia',
  'cybersecurity',
  'linux',
  'typescript',
];

const REDDIT_TRENDS = [
  'programming',
  'webdev',
  'machine learning',
  'react',
  'nextjs',
  'open source',
  'rust',
];

const TWITTER_TRENDS = [
  'ai',
  'startup',
  'devops',
  'cloud',
  'llm',
  'gpt-5',
  'automation',
];

export async function getSocialTrends() {
  const topics: SocialTrendTopic[] = [
    ...GOOGLE_TRENDS.map((t) => ({
      keyword: t,
      platform: 'google' as const,
      score: 95,
    })),

    ...REDDIT_TRENDS.map((t) => ({
      keyword: t,
      platform: 'reddit' as const,
      score: 85,
    })),

    ...TWITTER_TRENDS.map((t) => ({
      keyword: t,
      platform: 'twitter' as const,
      score: 90,
    })),
  ];

  return {
    topics,
    platformBreakdown: [],
    articleMatches: [],
  };
}

export function matchArticlesToSocialTrends(
  articles: Article[],
  trends: SocialTrendTopic[]
): SocialTrendMatch[] {
  const matches: SocialTrendMatch[] = [];

  for (const article of articles) {
    const text = `
      ${article.title}
      ${article.description || ''}
      ${(article.tags || []).join(' ')}
    `.toLowerCase();

    const matchedTopics: string[] = [];
    let score = 0;

    for (const trend of trends) {
      if (text.includes(trend.keyword.toLowerCase())) {
        matchedTopics.push(trend.keyword);
        score += trend.score;
      }
    }

    if (matchedTopics.length > 0) {
      matches.push({
        articleId: article.id,
        score,
        matchedTopics,
      });
    }
  }

  return matches;
}