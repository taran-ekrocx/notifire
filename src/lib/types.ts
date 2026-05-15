// lib/types.ts
export type Category = 'ai' | 'cybersecurity' | 'cloud' | 'databases' | 'infrastructure' | 'devops' | 'startup';

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

export const ALL_CATEGORIES: Category[] = ['ai', 'cybersecurity', 'cloud', 'databases', 'infrastructure', 'devops', 'startup'];

export const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string }> = {
  ai:             { label: 'AI',             emoji: '🤖', color: '#8b5cf6' },
  cybersecurity:  { label: 'Cybersecurity',  emoji: '🔐', color: '#ef4444' },
  cloud:          { label: 'Cloud',          emoji: '☁️', color: '#3b82f6' },
  databases:      { label: 'Databases',      emoji: '🗄️', color: '#10b981' },
  infrastructure: { label: 'Infrastructure', emoji: '⚙️', color: '#f59e0b' },
  devops:         { label: 'DevOps',         emoji: '🚀', color: '#ec4899' },
  startup:        { label: 'Startup',        emoji: '💡', color: '#06b6d4' },
};

export interface Article {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string; // ISO 8601
  source: string;
  imageUrl?: string;       // Original source image (not used directly)
  aiImageUrl?: string;    // AI-generated illustration path
  author?: string;
  category: Category;
  tags: string[];
  content?: string;       // Scraped full article text
  summary?: string;       // AI summary
  keyPoints?: string[];   // AI key points
  socialBoost?: number;     // Extra score from social media trends
  socialPlatforms?: SocialPlatform[]; // Which social platforms matched
  officialSource?: boolean;
  isTrending?: boolean;

trendSignals?: GeminiTrendSignals;

authorized?: boolean;

officialSourceName?: string;

officialSourceUrl?: string;
  readTimeMin?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  scrapedAt?: string;
  summarizedAt?: string;
}

export interface ArticleDetail {
  fullSummary: string;
  keyPoints: string[];
  readTimeMinutes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  relatedTopics: string[];
  linkedinDraft?: string;
  emailDraft?: string;
}

export interface ScrapeResult {
  url: string;
  title: string;
  text: string;
  html: string;
  publishedTime?: string;
  success: boolean;
  error?: string;
}

export interface TrendSignal {
  source: string;
  count: number;
  velocity: number; // mentions per hour
  authority: number; // 0-1 score
}

// ── Social Trend Types (for frontend) ───────────────────────────────

export type SocialPlatform = 'twitter' | 'reddit' | 'google';

export interface SocialTrendTopic {
  topic: string;
  mentions: number;
  platform: SocialPlatform;
  category: Category;
  score: number;
  url?: string;
  snippet?: string;
}

export interface SocialTrendMatch {
  articleId: string;
  articleTitle: string;
  socialBoost: number;
  platforms: SocialPlatform[];
  totalMentions: number;
}

export interface SocialPlatformBreakdown {
  platform: string;
  count: number;
  topTopic: string;
  avgScore: number;
}

export interface SocialTrendsData {
  topics: SocialTrendTopic[];
  platformBreakdown: SocialPlatformBreakdown[];
  articleMatches: SocialTrendMatch[];
}
