'use client';

import { Article, CATEGORY_META } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Clock,
  Sparkles,
  Loader2,
  Flame,
  CalendarDays,
  User,
  Globe,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatTimeAgo } from '@/lib/time-utils';
import Image from 'next/image';

interface ArticleModalProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleModal({ article, open, onOpenChange }: ArticleModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [scrapeContent, setScrapeContent] = useState<string | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!article || !open) {
      setScrapeContent(null);
      setAiImageUrl(null);
      setActiveTab('overview');
      return;
    }
    setAiImageUrl(article.aiImageUrl || null);
  }, [article, open]);

  const loadContent = useCallback(async () => {
    if (!article || scrapeContent || scrapeLoading) return;
    setScrapeLoading(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url }),
      });
      if (!res.ok) throw new Error('Scrape failed');
      const data = await res.json();
      setScrapeContent(data.content || null);
    } catch {
      // silently fail
    } finally {
      setScrapeLoading(false);
    }
  }, [article, scrapeContent, scrapeLoading]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === 'content') loadContent();
  }, [loadContent]);

  const handleRegenerateContent = useCallback(async () => {
    if (!article) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/regenerate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          url: article.url,
          title: article.title,
          description: article.description,
          category: article.category,
          tags: article.tags,
        }),
      });
      if (!res.ok) throw new Error('Regeneration failed');
      const data = await res.json();
      if (data.content) setScrapeContent(data.content);
      if (data.imageUrl) setAiImageUrl(data.imageUrl);
    } catch {
      // silently fail
    } finally {
      setRegenerating(false);
    }
  }, [article]);

  if (!article) return null;

  const meta = CATEGORY_META[article.category];
  const displayImage = aiImageUrl || article.aiImageUrl || article.imageUrl;
  const fullContent = scrapeContent || article.content || null;

  const trendingPlatforms: string[] = [];
  if (article.isTrending && article.trendSignals) {
    if ((article.trendSignals.twitter?.tweet_count || 0) >= 50) trendingPlatforms.push('Twitter / X');
    if ((article.trendSignals.reddit?.reddit_post_count || 0) >= 5) trendingPlatforms.push('Reddit');
    if ((article.trendSignals.google?.google_trend_score || 0) >= 30) trendingPlatforms.push('Google');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !rounded-none !border-0 !p-0 !gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{article.title}</DialogTitle>

        {/* Category colour bar */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: meta.color }} />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col gap-0"
          style={{ height: 'calc(100vh - 4px)' }}
        >
          {/* Sticky tab header */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-border/50 bg-background shrink-0">
            <Badge
              variant="secondary"
              className="text-xs font-semibold gap-1 border-0 shrink-0"
              style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
            >
              {meta.emoji} {meta.label}
            </Badge>
            <span className="text-sm font-semibold truncate flex-1 min-w-0">{article.title}</span>
            <TabsList className="shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Overview Tab ── */}
          <TabsContent
            value="overview"
            className="flex-1 overflow-y-auto outline-none m-0"
          >
            <div className="p-6 max-w-4xl mx-auto space-y-6 pb-12">

                {/* Title & Description */}
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold leading-snug">{article.title}</h1>
                  <p className="text-muted-foreground leading-relaxed">{article.description}</p>
                </div>

                {/* Image */}
                {displayImage && (
                  <div className="relative w-full h-72 rounded-xl overflow-hidden border border-border/30">
                    <Image
                      src={displayImage}
                      alt={`Illustration for: ${article.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 896px) 100vw, 896px"
                      priority
                    />
                    {(aiImageUrl || article.aiImageUrl) && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold gap-1 border-0 bg-black/60 text-white backdrop-blur-sm"
                        >
                          <Sparkles className="size-3" /> AI Generated
                        </Badge>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Metadata block */}
                <div className="rounded-lg border border-border/50 bg-muted/30 divide-y divide-border/40">
                  <div className="flex flex-wrap gap-x-8 gap-y-3 px-5 py-4 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4 shrink-0" />
                      <span className="text-foreground font-medium">Published:</span>
                      {new Date(article.publishedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-4 shrink-0" />
                      <span className="text-foreground font-medium">Published:</span>
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                    {article.source && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="size-4 shrink-0" />
                        <span className="text-foreground font-medium">Source:</span>
                        {article.source}
                      </span>
                    )}
                    {article.author && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-4 shrink-0" />
                        <span className="text-foreground font-medium">Author:</span>
                        {article.author}
                      </span>
                    )}
                    {article.readTimeMin && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 shrink-0" />
                        <span className="text-foreground font-medium">Read time:</span>
                        {article.readTimeMin} min
                      </span>
                    )}
                  </div>
                </div>

                {/* Trending On */}
                {article.isTrending ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Flame className="size-4 text-orange-500" />
                      <span className="text-sm font-semibold">Trending On</span>
                      <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-500 border-0">
                        Hot
                      </Badge>
                    </div>

                    {trendingPlatforms.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {trendingPlatforms.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Platform-wise signals */}
                    {article.trendSignals && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Twitter/X */}
                        <div className="p-4 rounded-lg bg-[#1da1f2]/5 border border-[#1da1f2]/20 space-y-2">
                          <div className="font-semibold text-[#1da1f2] text-sm">Twitter / X</div>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Tweets</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.twitter?.tweet_count || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Retweets</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.twitter?.retweet_count || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mentions</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.twitter?.mention_count || 0).toLocaleString()}
                              </span>
                            </div>
                            {(article.trendSignals.twitter?.hashtags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {article.trendSignals.twitter.hashtags.slice(0, 4).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reddit */}
                        <div className="p-4 rounded-lg bg-[#ff4500]/5 border border-[#ff4500]/20 space-y-2">
                          <div className="font-semibold text-[#ff4500] text-sm">Reddit</div>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Posts</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.reddit?.reddit_post_count || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Comments</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.reddit?.reddit_comment_count || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Upvotes</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.reddit?.reddit_upvote_count || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Engagement</span>
                              <span className="font-mono text-foreground">
                                {(article.trendSignals.reddit?.reddit_engagement || 0).toLocaleString()}
                              </span>
                            </div>
                            {(article.trendSignals.reddit?.subreddits || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {article.trendSignals.reddit.subreddits.slice(0, 3).map((sub) => (
                                  <Badge key={sub} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                    r/{sub}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Google */}
                        <div className="p-4 rounded-lg bg-[#4285f4]/5 border border-[#4285f4]/20 space-y-2">
                          <div className="font-semibold text-[#4285f4] text-sm">Google</div>
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Trend Score</span>
                              <span className="font-mono text-foreground">
                                {article.trendSignals.google?.google_trend_score || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Search Delta</span>
                              <span className="font-mono text-foreground">
                                +{(article.trendSignals.google?.google_search_frequency_delta || 0).toFixed(1)}%
                              </span>
                            </div>
                            {(article.trendSignals.google?.related_queries || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {article.trendSignals.google.related_queries.slice(0, 3).map((q) => (
                                  <Badge key={q} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                    {q}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {article.trendSignals?.reasoning && (
                      <p className="text-xs text-muted-foreground italic">{article.trendSignals.reasoning}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame className="size-4 opacity-40" />
                    <span>Not currently trending on any platform.</span>
                  </div>
                )}

            </div>
          </TabsContent>

          {/* ── Content Tab ── */}
          <TabsContent
            value="content"
            className="flex-1 overflow-y-auto outline-none m-0"
          >
            <div className="p-6 max-w-4xl mx-auto space-y-6 pb-12">

                {/* Title */}
                <h1 className="text-2xl font-bold leading-snug">{article.title}</h1>

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="size-3.5" />
                    Read Full Article
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleRegenerateContent}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <><Loader2 className="size-3.5 animate-spin" /> Regenerating...</>
                    ) : (
                      <><RefreshCw className="size-3.5" /> Regenerate Content</>
                    )}
                  </Button>
                </div>

                {/* Article Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold">Article Content</h4>
                  </div>

                  {scrapeLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  )}

                  {!scrapeLoading && fullContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-muted/50 rounded-lg p-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                    >
                      {fullContent}
                    </motion.div>
                  )}

                  {!scrapeLoading && !fullContent && (
                    <div className="bg-muted/30 rounded-lg p-8 flex flex-col items-center justify-center gap-3 border border-dashed border-border/50 min-h-[120px]">
                      <p className="text-xs text-muted-foreground text-center">
                        Could not load article content. Try &quot;Regenerate Content&quot; to fetch and enhance it with Gemini AI.
                      </p>
                    </div>
                  )}
                </div>

            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
