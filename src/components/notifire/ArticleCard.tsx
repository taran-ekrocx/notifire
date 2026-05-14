'use client';

import { Article, CATEGORY_META } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingBadge } from './TrendingBadge';
import { Heart, Clock, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTimeAgo } from '@/lib/time-utils';
import Image from 'next/image';

interface ArticleCardProps {
  article: Article;
  isSaved: boolean;
  onSave: (articleId: string) => void;
  onClick: (article: Article) => void;
  index: number;
}

export function ArticleCard({ article, isSaved, onSave, onClick, index }: ArticleCardProps) {
  const meta = CATEGORY_META[article.category];
  const displayImage = article.aiImageUrl || article.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card
        className="group relative cursor-pointer overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 py-0 gap-0"
        onClick={() => onClick(article)}
      >
        {/* AI-generated or source image */}
        {displayImage && (
          <div className="relative w-full h-36 overflow-hidden">
            <Image
              src={displayImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />

            {/* AI-generated badge */}
            {article.aiImageUrl && (
              <div className="absolute top-2 right-2 z-10">
                <Badge
                  variant="secondary"
                  className="text-[9px] font-semibold gap-0.5 border-0 bg-black/60 text-white backdrop-blur-sm px-1.5 py-0.5"
                >
                  <Sparkles className="size-2.5" />
                  AI
                </Badge>
              </div>
            )}

            {/* Category badge overlaid on image */}
            <div className="absolute bottom-2 left-2 z-10">
              <Badge
                variant="secondary"
                className="text-[11px] font-semibold gap-1 border-0 backdrop-blur-sm"
                style={{
                  backgroundColor: `${meta.color}cc`,
                  color: '#fff',
                }}
              >
                <span className="text-xs">{meta.emoji}</span>
                {meta.label}
              </Badge>
            </div>

            {/* Trending badge */}
            {article.isTrending && (
  <div className="absolute top-2 left-2 z-10 rounded-md bg-black/70 px-2 py-1 text-white backdrop-blur-sm">
    <div className="text-[10px] font-semibold uppercase tracking-wide">
      Trending
    </div>

    <div className="mt-1 flex flex-wrap gap-1">
      {article.trendingOn?.map((platform) => (
        <span
          key={platform}
          className="rounded bg-white/20 px-1.5 py-0.5 text-[9px]"
        >
          {platform}
        </span>
      ))}
    </div>

    <div className="mt-1 text-[9px] text-white/80">
      {(article.trendingCount || 0).toLocaleString()} discussions
    </div>
  </div>
)}
          </div>
        )}

        {/* Fallback: no image — use category color accent bar */}
        {!displayImage && (
          <>
            <div className="h-1 w-full" style={{ backgroundColor: meta.color }} />
            <CardContent className="p-4 flex flex-col gap-3">
              {/* Top row: Category badge + Trending + Save */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold gap-1 border-0"
                    style={{
                      backgroundColor: `${meta.color}20`,
                      color: meta.color,
                    }}
                  >
                    <span className="text-xs">{meta.emoji}</span>
                    {meta.label}
                  </Badge>
                  {article.isTrending && (
  <div className="flex flex-wrap items-center gap-1">
    {article.trendingOn?.map((platform) => (
      <Badge
        key={platform}
        variant="secondary"
        className="text-[10px]"
      >
        {platform}
      </Badge>
    ))}

    <span className="text-[10px] text-muted-foreground">
      {(article.trendingCount || 0).toLocaleString()} discussions
    </span>
  </div>
)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 -mr-1 -mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave(article.id);
                  }}
                  aria-label={isSaved ? 'Unsave article' : 'Save article'}
                >
                  <Heart
                    className={`size-4 transition-colors ${
                      isSaved
                        ? 'fill-red-500 text-red-500'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        <CardContent className={`p-4 flex flex-col gap-2.5 ${displayImage ? 'pt-2' : ''}`}>
          {/* Save button (when image is shown) */}
          {displayImage && (
            <div className="flex items-center justify-between -mt-0.5">
             
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(article.id);
                }}
                aria-label={isSaved ? 'Unsave article' : 'Save article'}
              >
                <Heart
                  className={`size-3.5 transition-colors ${
                    isSaved
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
              </Button>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
              {article.description}
            </p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Source + Author + Time */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto pt-1">
            <span className="font-medium truncate max-w-[120px]">{article.source}</span>
            {article.author && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1 truncate max-w-[100px]">
                  <User className="size-3 shrink-0" />
                  {article.author}
                </span>
              </>
            )}
            <span className="text-border">·</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="size-3 shrink-0" />
              {formatTimeAgo(article.publishedAt)}
            </span>
            {article.readTimeMin && (
              <>
                <span className="text-border">·</span>
                <span className="whitespace-nowrap">{article.readTimeMin}m read</span>
              </>
            )}
          </div>
        </CardContent>

        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Card>
    </motion.div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 py-0 gap-0">
      <Skeleton className="h-36 w-full rounded-none" />
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 mt-auto pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}
