'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  TrendingUp,
  ExternalLink,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { SocialTrendTopic, SocialPlatformBreakdown, SocialTrendMatch } from '@/lib/types';

// ── Platform icon/color ──────────────────────────────────────────────
const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
  twitter:    { icon: '𝕏', color: '#1da1f2', label: 'Twitter/X' },
  reddit:     { icon: '⬆', color: '#ff4500', label: 'Reddit' },
  hackernews: { icon: 'Y', color: '#f56565', label: 'Hacker News' },
};

// ── Props ────────────────────────────────────────────────────────────
interface SocialTrendsPanelProps {
  topics: SocialTrendTopic[];
  platformBreakdown: SocialPlatformBreakdown[];
  articleMatches: SocialTrendMatch[];
}

// ── Component ────────────────────────────────────────────────────────
export function SocialTrendsPanel({
  topics,
  platformBreakdown,
  articleMatches,
}: SocialTrendsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Platform Breakdown */}
      {platformBreakdown && platformBreakdown.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-violet-500" />
            Social Platforms Active
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {platformBreakdown.map((p) => {
              const meta = PLATFORM_META[p.platform.toLowerCase().replace(' ', '')] || PLATFORM_META['twitter'];
              return (
                <motion.div
                  key={p.platform}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-border/30 bg-card/50">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className="size-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{p.platform}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {p.count}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{p.topTopic}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold" style={{ color: meta.color }}>
                          {Math.round(p.avgScore * 100)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">buzz</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending on Social */}
      {topics && topics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="size-4 text-orange-500" />
            Trending on Social Media
          </h3>
          <ScrollArea className="max-h-72">
            <div className="space-y-1.5 pr-2">
              {topics.slice(0, 15).map((topic, i) => {
                const meta = PLATFORM_META[topic.platform] || PLATFORM_META['twitter'];
                return (
                  <motion.div
                    key={`${topic.platform}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/20 hover:border-border/50 transition-colors group"
                  >
                    <div
                      className="size-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {topic.topic}
                      </p>
                      {topic.snippet && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {topic.snippet}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        <MessageCircle className="size-2.5 mr-0.5" />
                        {topic.mentions}
                      </Badge>
                      {topic.url && (
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Articles Matched to Social Trends */}
      {articleMatches && articleMatches.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ArrowUpRight className="size-4 text-green-500" />
            Articles Trending on Social
          </h3>
          <div className="space-y-1.5">
            {articleMatches.slice(0, 8).map((match, i) => (
              <motion.div
                key={match.articleId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/15"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{match.articleTitle}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {match.platforms.map(p => {
                      const meta = PLATFORM_META[p] || PLATFORM_META['twitter'];
                      return (
                        <Badge
                          key={p}
                          className="text-[9px] px-1.5 py-0 h-4 font-medium"
                          style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: 'none' }}
                        >
                          {meta.label}
                        </Badge>
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground">
                      {match.totalMentions} mentions
                    </span>
                  </div>
                </div>
                <Badge className="text-[10px] px-2 bg-green-500/15 text-green-500 border-none font-semibold">
                  +{match.socialBoost}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!topics || topics.length === 0) && (!articleMatches || articleMatches.length === 0) && (
        <div className="flex flex-col items-center py-8 gap-2">
          <MessageCircle className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No social trends data available</p>
          <p className="text-xs text-muted-foreground">Social signals from Reddit, Twitter/X, and Hacker News will appear here</p>
        </div>
      )}
    </div>
  );
}
