'use client';

import { Article, ArticleDetail, CATEGORY_META } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Clock,
  Copy,
  Check,
  Download,
  Sparkles,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Tag,
  Share2,
  Loader2,
  ImagePlus,
  Flame,
  Shield,
  Radio,
  FileText,
  CalendarDays,
  User,
  Globe,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeAgo } from '@/lib/time-utils';
import Image from 'next/image';

interface ArticleModalProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleModal({ article, open, onOpenChange }: ArticleModalProps) {
  const [detail, setDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeContent, setScrapeContent] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!article || !open) {
      setDetail(null);
      setError(null);
      setScrapeContent(null);
      setAiImageUrl(null);
      return;
    }

    setAiImageUrl(article.aiImageUrl || null);

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        url: article.url,
        description: article.description,
        source: article.source,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch detail');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load article detail');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [article, open]);

  const handleScrape = useCallback(async () => {
    if (!article) return;
    setScrapeLoading(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url, summarize: true }),
      });
      if (!res.ok) throw new Error('Scrape failed');
      const data = await res.json();
      setScrapeContent(data.content || null);
      if (data.summary) setDetail(data.summary);
    } catch {
      // silently fail
    } finally {
      setScrapeLoading(false);
    }
  }, [article]);

  const handleGenerateImage = useCallback(async () => {
    if (!article) return;
    setImageGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          title: article.title,
          description: article.description,
          category: article.category,
          tags: article.tags,
          url: article.url,
        }),
      });
      if (!res.ok) throw new Error('Image generation failed');
      const data = await res.json();
      if (data.imageUrl) setAiImageUrl(data.imageUrl);
    } catch {
      // silently fail
    } finally {
      setImageGenerating(false);
    }
  }, [article]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  }, []);

  if (!article) return null;

  const meta = CATEGORY_META[article.category];
  const displayImage = aiImageUrl || article.aiImageUrl || article.imageUrl;

  const sentimentConfig = {
    positive: { icon: ThumbsUp,   label: 'Positive', color: 'text-green-500',          bg: 'bg-green-500/10 border-green-500/30' },
    neutral:  { icon: Minus,      label: 'Neutral',  color: 'text-muted-foreground',    bg: 'bg-secondary border-secondary' },
    negative: { icon: ThumbsDown, label: 'Negative', color: 'text-red-500',             bg: 'bg-red-500/10 border-red-500/30' },
  };

  const sentiment = detail?.sentiment || article.sentiment || 'neutral';
  const sentimentInfo = sentimentConfig[sentiment];
  const SentimentIcon = sentimentInfo.icon;

  // Determine what content to show: freshly scraped > pre-stored on article
  const fullContent = scrapeContent || article.content || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Category colour accent */}
        <div className="h-1.5 w-full" style={{ backgroundColor: meta.color }} />

        <ScrollArea className="max-h-[calc(90vh-6px)]">
          <div className="p-6 space-y-5">

            {/* ── Header ── */}
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold gap-1 border-0"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">{article.source}</span>
                {article.author && (
                  <>
                    <span className="text-border text-xs">·</span>
                    <span className="text-xs text-muted-foreground">{article.author}</span>
                  </>
                )}
                <span className="text-border text-xs">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTimeAgo(article.publishedAt)}
                </span>
              </div>

              <DialogTitle className="text-lg leading-snug">{article.title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">{article.description}</DialogDescription>
            </DialogHeader>

            {/* ── Image ── */}
            {displayImage ? (
              <div className="space-y-2">
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border/30">
                  <Image
                    src={displayImage}
                    alt={`Illustration for: ${article.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 672px) 100vw, 672px"
                    priority
                  />
                  {(aiImageUrl || article.aiImageUrl) && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-[10px] font-semibold gap-1 border-0 bg-black/60 text-white backdrop-blur-sm">
                        <Sparkles className="size-3" /> AI Generated
                      </Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={handleGenerateImage}
                  disabled={imageGenerating}
                >
                  {imageGenerating
                    ? <><Loader2 className="size-3 animate-spin" /> Regenerating...</>
                    : <><Sparkles className="size-3" /> Regenerate Image</>}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline" size="sm"
                className="gap-1.5 w-full border-dashed"
                onClick={handleGenerateImage}
                disabled={imageGenerating}
              >
                {imageGenerating
                  ? <><Loader2 className="size-3.5 animate-spin" /> Generating AI Illustration...</>
                  : <><ImagePlus className="size-3.5" /> Generate AI Illustration</>}
              </Button>
            )}

            {/* ── Key Article Data ── */}
            <div className="rounded-lg border border-border/50 bg-muted/30 divide-y divide-border/40">

              {/* Row: Published / Author */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span className="text-foreground font-medium">Published:</span>
                  {new Date(article.publishedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {article.author && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="size-3.5 shrink-0" />
                    <span className="text-foreground font-medium">Author:</span>
                    {article.author}
                  </span>
                )}
                {article.source && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="size-3.5 shrink-0" />
                    <span className="text-foreground font-medium">Source:</span>
                    {article.source}
                  </span>
                )}
              </div>

              {/* Row: Read time / Sentiment / Scraped */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-xs">
                {article.readTimeMin && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" />
                    <span className="text-foreground font-medium">Read time:</span>
                    {article.readTimeMin} min
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <SentimentIcon className={`size-3.5 shrink-0 ${sentimentInfo.color}`} />
                  <span className="text-foreground font-medium">Sentiment:</span>
                  <span className={sentimentInfo.color}>{sentimentInfo.label}</span>
                </span>
                {article.scrapedAt && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Download className="size-3.5 shrink-0" />
                    <span className="text-foreground font-medium">Scraped:</span>
                    {formatTimeAgo(article.scrapedAt)}
                  </span>
                )}
              </div>

              {/* Row: Trending */}
              {article.isTrending && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Flame className="size-3.5 shrink-0 text-orange-500" />
                    <span className="text-foreground font-medium">Trending:</span>
                    <Badge variant="secondary" className="text-[10px] gap-1 bg-orange-500/10 text-orange-500 border-0">
                      Hot
                    </Badge>
                    {article.trendingCount != null && (
                      <span className="text-muted-foreground">{article.trendingCount.toLocaleString()} signals</span>
                    )}
                  </span>
                  {article.trendingOn && article.trendingOn.length > 0 && (
                    <span className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                      <TrendingUp className="size-3.5 shrink-0" />
                      <span className="text-foreground font-medium">Trending on:</span>
                      {article.trendingOn.map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px] capitalize">{p}</Badge>
                      ))}
                    </span>
                  )}
                </div>
              )}

              {/* Row: Social boost */}
              {article.socialBoost != null && article.socialBoost > 0 && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Radio className="size-3.5 shrink-0 text-cyan-500" />
                    <span className="text-foreground font-medium">Social boost:</span>
                    +{article.socialBoost}
                  </span>
                  {article.socialPlatforms && article.socialPlatforms.length > 0 && (
                    <span className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                      {article.socialPlatforms.map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px] capitalize">{p}</Badge>
                      ))}
                    </span>
                  )}
                </div>
              )}

              {/* Row: Official source */}
              {(article.authorized || article.officialSourceName) && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Shield className="size-3.5 shrink-0 text-emerald-500" />
                    <span className="text-foreground font-medium">Official source:</span>
                    {article.officialSourceName ? (
                      article.officialSourceUrl ? (
                        <a
                          href={article.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 underline underline-offset-2"
                        >
                          {article.officialSourceName}
                        </a>
                      ) : (
                        <span className="text-emerald-500">{article.officialSourceName}</span>
                      )
                    ) : (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-0">Verified</Badge>
                    )}
                  </span>
                </div>
              )}

              {/* Row: Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap items-start gap-2 px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-foreground font-medium shrink-0">
                    <Tag className="size-3.5" /> Tags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Full Scraped Content ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold">Full Article Content</h4>
                </div>
                <Button
                  variant="outline" size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleScrape}
                  disabled={scrapeLoading}
                >
                  {scrapeLoading
                    ? <><Loader2 className="size-3 animate-spin" /> Scraping...</>
                    : fullContent
                      ? <><RefreshCw className="size-3" /> Re-scrape</>
                      : <><Download className="size-3" /> Scrape Content</>}
                </Button>
              </div>

              {fullContent ? (
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {fullContent}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center gap-2 min-h-[80px] border border-dashed border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    No scraped content yet. Click &quot;Scrape Content&quot; to fetch the full article text.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* ── AI Analysis ── */}
            {loading && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>AI is analysing this article…</span>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="py-4 text-center">
                <p className="text-sm text-destructive mb-1">{error}</p>
                <p className="text-xs text-muted-foreground">AI analysis unavailable. You can still read the article or scrape its content.</p>
              </div>
            )}

            {detail && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* AI Summary */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-4 text-violet-500" />
                    <h4 className="text-sm font-semibold">AI Summary</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{detail.fullSummary}</p>
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="size-4 text-amber-500" />
                    <h4 className="text-sm font-semibold">Key Points</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {(detail.keyPoints || []).length > 0 ? (
                      detail.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                          {point}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">No key points available.</li>
                    )}
                  </ul>
                </div>

                {/* Read time + Sentiment */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>{detail.readTimeMinutes} min read</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[11px] gap-1 ${sentimentInfo.bg} ${sentimentInfo.color} border-0`}
                  >
                    <SentimentIcon className="size-3" />
                    {sentimentInfo.label}
                  </Badge>
                </div>

                {/* Related Topics */}
                {detail.relatedTopics && detail.relatedTopics.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="size-4 text-cyan-500" />
                      <h4 className="text-sm font-semibold">Related Topics</h4>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {detail.relatedTopics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* LinkedIn Draft */}
                {detail.linkedinDraft && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Share2 className="size-4 text-blue-500" />
                        <h4 className="text-sm font-semibold">LinkedIn Draft</h4>
                      </div>
                      <Button
                        variant="ghost" size="sm" className="h-7 text-xs gap-1"
                        onClick={() => handleCopy(detail.linkedinDraft!, 'linkedin')}
                      >
                        {copiedField === 'linkedin'
                          ? <><Check className="size-3 text-green-500" /> Copied!</>
                          : <><Copy className="size-3" /> Copy</>}
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                      {detail.linkedinDraft}
                    </div>
                  </div>
                )}

                {/* Email Draft */}
                {detail.emailDraft && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Share2 className="size-4 text-green-500" />
                        <h4 className="text-sm font-semibold">Email Draft</h4>
                      </div>
                      <Button
                        variant="ghost" size="sm" className="h-7 text-xs gap-1"
                        onClick={() => handleCopy(detail.emailDraft!, 'email')}
                      >
                        {copiedField === 'email'
                          ? <><Check className="size-3 text-green-500" /> Copied!</>
                          : <><Copy className="size-3" /> Copy</>}
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                      {detail.emailDraft}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <Separator />

            {/* ── Action bar ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="default" size="sm" className="gap-1.5"
                onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-3.5" />
                Read Full Article
              </Button>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
