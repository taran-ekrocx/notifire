// lib/config/rss-sources.ts
import { Category } from '../types';

export const RSS_SOURCES: Record<Category, Array<{ url: string; authority: number }>> = {
  ai: [
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', authority: 0.9 },
    { url: 'https://venturebeat.com/category/ai/feed/', authority: 0.85 },
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', authority: 0.88 },
    { url: 'https://www.technologyreview.com/feed/', authority: 0.92 },
  ],
  cybersecurity: [
    { url: 'https://feeds.feedburner.com/TheHackersNews', authority: 0.85 },
    { url: 'https://krebsonsecurity.com/feed/', authority: 0.92 },
    { url: 'https://www.darkreading.com/rss.xml', authority: 0.88 },
    { url: 'https://www.schneier.com/feed/atom/', authority: 0.9 },
  ],
  cloud: [
    { url: 'https://aws.amazon.com/blogs/aws/feed/', authority: 0.9 },
    { url: 'https://thenewstack.io/feed/', authority: 0.8 },
  ],
  databases: [
    { url: 'https://www.postgresql.org/news.rss', authority: 0.85 },
    { url: 'https://thenewstack.io/feed/', authority: 0.75 },
    { url: 'https://redis.io/blog/feed/', authority: 0.82 },
  ],
  infrastructure: [
    { url: 'https://kubernetes.io/feed.xml', authority: 0.9 },
    { url: 'https://devops.com/feed/', authority: 0.78 },
    { url: 'https://thenewstack.io/feed/', authority: 0.8 },
    { url: 'https://www.infoq.com/feed/', authority: 0.82 },
  ],
  devops: [
    { url: 'https://devops.com/feed/', authority: 0.82 },
    { url: 'https://www.infoq.com/feed/', authority: 0.8 },
    { url: 'https://www.hashicorp.com/blog/feed.xml', authority: 0.88 },
  ],
  startup: [
    { url: 'https://techcrunch.com/category/startups/feed/', authority: 0.88 },
    { url: 'https://news.ycombinator.com/rss', authority: 0.85 },
  ],
};
