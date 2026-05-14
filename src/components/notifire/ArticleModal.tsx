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
  const [scrapeResult, setScrapeResult] = useState<{
    content?: string;
    wordCount?: number;
    estimatedReadTime?: number;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  // Fetch article detail when modal opens
  useEffect(() => {
    if (!article || !open) {
      setDetail(null);
      setError(null);
      setScrapeResult(null);
      setAiImageUrl(null);
      return;
    }

    // Set initial AI image from article data
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

    return () => {
      cancelled = true;
    };
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
      setScrapeResult({
        content: data.content,
        wordCount: data.wordCount,
        estimatedReadTime: data.estimatedReadTime,
      });
      // If summary was also generated, update detail
      if (data.summary) {
        setDetail(data.summary);
      }
    } catch {
      // Silently fail
    } finally {
      setScrapeLoading(false);
    }
  }, [article]);

  // Generate AI image for this article
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
      if (data.imageUrl) {
        setAiImageUrl(data.imageUrl);
      }
    } catch {
      // Silently fail
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
      // Fallback
    }
  }, []);

  if (!article) return null;

  const meta = CATEGORY_META[article.category];
  const displayImage = aiImageUrl || article.aiImageUrl || article.imageUrl;

  const sentimentConfig = {
    positive: { icon: ThumbsUp, label: 'Positive', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
    neutral: { icon: Minus, label: 'Neutral', color: 'text-muted-foreground', bg: 'bg-secondary border-secondary' },
    negative: { icon: ThumbsDown, label: 'Negative', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  };

  const sentiment = detail?.sentiment || article.sentiment || 'neutral';
  const sentimentInfo = sentimentConfig[sentiment];
  const SentimentIcon = sentimentInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header with category color accent */}
        <div className="h-1.5 w-full" style={{ backgroundColor: meta.color }} />

        <ScrollArea className="max-h-[calc(90vh-6px)]">
          <div className="p-6">
            <DialogHeader className="space-y-3 mb-4">
              {/* Category + Source row */}
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

              {/* Title */}
              <DialogTitle className="text-lg leading-snug">
                {article.title}
              </DialogTitle>

              <DialogDescription className="text-sm leading-relaxed">
                {article.description}
              </DialogDescription>
            </DialogHeader>

            {/* AI-Generated Article Illustration */}
            {displayImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 border border-border/30">
                <Image
                  src={displayImage}
                  alt={`AI illustration for: ${article.title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                  priority
                />
                {/* AI badge overlay */}
                {(aiImageUrl || article.aiImageUrl) && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold gap-1 border-0 bg-black/60 text-white backdrop-blur-sm"
                    >
                      <Sparkles className="size-3" />
                      AI Generated
                    </Badge>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}

            {/* Generate AI Image button (if no image yet) */}
            {!displayImage && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 w-full border-dashed"
                  onClick={handleGenerateImage}
                  disabled={imageGenerating}
                >
                  {imageGenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Generating AI Illustration...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-3.5" />
                      Generate AI Illustration
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Regenerate image button (if image exists) */}
            {displayImage && (
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={handleGenerateImage}
                  disabled={imageGenerating}
                >
                  {imageGenerating ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3" />
                      Regenerate Image
                    </>
                  )}
                </Button>
              </div>
            )}

            <Separator className="my-4" />

            {/* Loading state */}
            {loading && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>AI is analyzing this article...</span>
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

            {/* Error state */}
            {error && !loading && (
              <div className="py-8 text-center">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <p className="text-xs text-muted-foreground">
                  You can still read the original article or try scraping.
                </p>
              </div>
            )}

            {/* Detail content */}
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {detail.fullSummary}
                  </p>
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="size-4 text-amber-500" />
                    <h4 className="text-sm font-semibold">Key Points</h4>
                  </div>
                  <ul className="space-y-1.5">
  {(detail.keyPoints || []).length > 0 ? (
    (detail.keyPoints || []).map((point, i) => (
      <li
        key={i}
        className="flex items-start gap-2 text-sm text-muted-foreground"
      >
        <span className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
        {point}
      </li>
    ))
  ) : (
    <li className="text-sm text-muted-foreground">
      No key points available.
    </li>
  )}
</ul>
                </div>

                {/* Read Time + Sentiment */}
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
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
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
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleCopy(detail.linkedinDraft!, 'linkedin')}
                      >
                        {copiedField === 'linkedin' ? (
                          <><Check className="size-3 text-green-500" /> Copied!</>
                        ) : (
                          <><Copy className="size-3" /> Copy</>
                        )}
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
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleCopy(detail.emailDraft!, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <><Check className="size-3 text-green-500" /> Copied!</>
                        ) : (
                          <><Copy className="size-3" /> Copy</>
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                      {detail.emailDraft}
                    </div>
                  </div>
                )}

                {/* Scrape result */}
                {scrapeResult && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Download className="size-4 text-emerald-500" />
                        <h4 className="text-sm font-semibold">Full Content</h4>
                        <span className="text-xs text-muted-foreground">
                          {scrapeResult.wordCount} words · {scrapeResult.estimatedReadTime} min read
                        </span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed max-h-64 overflow-y-auto">
                        {scrapeResult.content?.slice(0, 2000)}
                        {(scrapeResult.content?.length || 0) > 2000 && (
                          <span className="text-primary">... Read more at source</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <Separator className="my-4" />

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
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
                onClick={handleScrape}
                disabled={scrapeLoading}
              >
                {scrapeLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {scrapeLoading ? 'Scraping...' : 'Scrape Full Content'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
