'use client';

import { useState, useEffect, useCallback } from 'react';
import { Article, Category, SocialTrendTopic, SocialPlatformBreakdown, SocialTrendMatch } from '@/lib/types';
import { CategoryFilter } from './CategoryFilter';
import { SearchBar } from './SearchBar';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';
import { ArticleModal } from './ArticleModal';
import { DocsPanel } from './DocsPanel';
import { SocialTrendsPanel } from './SocialTrendsPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rss,
  Zap,
  TrendingUp,
  Bookmark,
  RefreshCw,
  Database,
  Moon,
  Sun,
  Flame,
  Newspaper,
  AlertCircle,
  Clock,
  BookOpen,
  Download,
} from 'lucide-react';
import { useTheme } from 'next-themes';

type SourceTab = 'rss' | 'ailive' | 'trending' | 'saved' | 'docs';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface NewsFeedState {
  articles: Article[];
  savedIds: Set<string>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  socialTrends: {
    topics: SocialTrendTopic[];
    platformBreakdown: SocialPlatformBreakdown[];
    articleMatches: SocialTrendMatch[];
  } | null;
}

export function NewsFeed() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [activeTab, setActiveTab] = useState<SourceTab>('rss');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [state, setState] = useState<NewsFeedState>({
    articles: [],
    savedIds: new Set(),
    loading: false,
    error: null,
    lastUpdated: null,
    socialTrends: null,
  });

  const fetchSavedIds = useCallback(async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(data.articles.map((a: Article) => a.id));
        setState((prev) => ({ ...prev, savedIds: ids }));
      }
    } catch {
      // silent
    }
  }, []);

  // Load articles from DB (used on page load, tab changes, and category changes)
  const fetchArticles = useCallback(async () => {
    if (activeTab === 'docs') return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let articles: Article[] = [];

      if (activeTab === 'rss' || activeTab === 'ailive') {
        const categoryParam = activeCategory === 'all' ? 'all' : activeCategory;
        const res = await fetch(`/api/articles?category=${categoryParam}`);
        if (!res.ok) throw new Error('Failed to load articles from database');
        const data = await res.json();
        articles = data.articles || [];
      } else if (activeTab === 'trending') {
        const res = await fetch('/api/trending');
        if (!res.ok) throw new Error('Failed to fetch trending');
        const data = await res.json();
        articles = data.articles || [];
        if (data.socialTrends) {
          setState(prev => ({ ...prev, socialTrends: data.socialTrends }));
        }
      } else if (activeTab === 'saved') {
        const res = await fetch('/api/saved');
        if (!res.ok) throw new Error('Failed to fetch saved');
        const data = await res.json();
        articles = data.articles || [];
      }

      // 24h safety filter (DB route already filters, kept for trending/saved)
      const cutoff = Date.now() - TWENTY_FOUR_HOURS;
      const recentArticles = activeTab === 'saved'
        ? articles
        : articles.filter(a => {
            const pubTime = new Date(a.publishedAt).getTime();
            return !isNaN(pubTime) && pubTime >= cutoff;
          });

      setState((prev) => ({
        ...prev,
        articles: recentArticles,
        loading: false,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load articles',
      }));
    }
  }, [activeTab, activeCategory]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load from DB on mount, tab change, and category change
  useEffect(() => {
    fetchArticles();
    fetchSavedIds();
  }, [fetchArticles, fetchSavedIds]);

  // Save/unsave article
  const handleSave = useCallback(
    async (articleId: string) => {
      const isSaved = state.savedIds.has(articleId);
      setState((prev) => {
        const newIds = new Set(prev.savedIds);
        if (isSaved) newIds.delete(articleId);
        else newIds.add(articleId);
        return { ...prev, savedIds: newIds };
      });

      try {
        if (isSaved) {
          await fetch('/api/saved', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId }),
          });
        } else {
          await fetch('/api/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId }),
          });
        }
      } catch {
        setState((prev) => {
          const newIds = new Set(prev.savedIds);
          if (isSaved) newIds.add(articleId);
          else newIds.delete(articleId);
          return { ...prev, savedIds: newIds };
        });
      }
    },
    [state.savedIds]
  );

  const handleArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
    setModalOpen(true);
  }, []);

  // Refresh: trigger RSS fetch for all categories, then reload from DB
  const handleRefresh = useCallback(async () => {
    if (activeTab === 'docs') return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await fetch('/api/news?category=all&refresh=true&withImages=true');
    } catch {
      // best-effort — reload from DB regardless
    }
    await fetchArticles();
  }, [activeTab, fetchArticles]);

  const filteredArticles = state.articles.filter((article) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      article.description?.toLowerCase().includes(q) ||
      article.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Flame className="size-6 text-violet-500" />
                <h1 className="text-lg font-bold tracking-tight">
                  Notifire
                  <span className="text-violet-500">.in</span>
                </h1>
              </div>
              <span className="hidden sm:inline text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full">
                24h Tech Intelligence
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* PDF Download */}
              <a
                href="/Notifire_Documentation.pdf"
                download="Notifire_Documentation.pdf"
                className="shrink-0"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label="Download Documentation PDF"
                >
                  <Download className="size-4" />
                </Button>
              </a>

              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {mounted &&
                    (theme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                      >
                        <Sun className="size-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                      >
                        <Moon className="size-4" />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
        {/* Category Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 overflow-x-auto">
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
          <div className="w-full sm:w-64 shrink-0">
            <SearchBar query={searchQuery} onQueryChange={setSearchQuery} />
          </div>
        </div>

        {/* Source Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SourceTab)}>
          <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex h-9">
            <TabsTrigger value="rss" className="gap-1.5 text-xs sm:text-sm">
              <Rss className="size-3.5" />
              <span className="hidden sm:inline">24h Feed</span>
              <span className="sm:hidden">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="ailive" className="gap-1.5 text-xs sm:text-sm">
              <Zap className="size-3.5" />
              <span className="hidden sm:inline">AI Live</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="size-3.5" />
              <span className="hidden sm:inline">Trending</span>
              <span className="sm:hidden">Hot</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 text-xs sm:text-sm">
              <Bookmark className="size-3.5" />
              <span className="hidden sm:inline">Saved</span>
              <span className="sm:hidden">Saved</span>
              {state.savedIds.size > 0 && (
                <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5 min-w-[18px] text-center">
                  {state.savedIds.size}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="size-3.5" />
              <span className="hidden sm:inline">Docs</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
          </TabsList>

          {/* Docs tab */}
          <TabsContent value="docs" className="mt-4">
            <DocsPanel />
          </TabsContent>

          {/* Trending tab */}
          <TabsContent value="trending" className="mt-4">
            {state.socialTrends && (
              <div className="mb-6">
                <SocialTrendsPanel
                  topics={state.socialTrends.topics}
                  platformBreakdown={state.socialTrends.platformBreakdown}
                  articleMatches={state.socialTrends.articleMatches}
                />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Flame className="size-4 text-orange-500" />
                Top Trending Articles
              </h3>
              {!state.loading && !state.error && filteredArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredArticles.map((article, index) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isSaved={state.savedIds.has(article.id)}
                        onSave={handleSave}
                        onClick={handleArticleClick}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>

          {/* RSS / AI Live / Saved tabs */}
          <TabsContent value={activeTab === 'docs' ? 'rss' : (activeTab === 'trending' ? 'rss' : activeTab)} className="mt-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between gap-3 mb-4 px-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {(activeTab === 'rss' || activeTab === 'ailive') ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>Last 24h</span>
                    </div>
                    <span className="text-border">·</span>
                    <div className="flex items-center gap-1">
                      <Database className="size-3" />
                      <span>From database</span>
                    </div>
                  </>
                ) : null}
                <span className="text-border">·</span>
                <span>Updated {formatLastUpdated(state.lastUpdated)}</span>
                <span className="text-border">·</span>
                <span>{filteredArticles.length} articles</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleRefresh}
                disabled={state.loading}
              >
                <RefreshCw className={`size-3 ${state.loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Loading skeleton */}
            {state.loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error state */}
            {!state.loading && state.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <AlertCircle className="size-10 text-destructive" />
                <div className="text-center">
                  <p className="font-medium mb-1">Failed to load articles</p>
                  <p className="text-sm text-muted-foreground">{state.error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="size-3.5" /> Try Again
                </Button>
              </motion.div>
            )}

            {/* Empty state */}
            {!state.loading && !state.error && filteredArticles.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <Newspaper className="size-10 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium mb-1">No articles found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try a different search query'
                      : activeTab === 'saved'
                      ? 'Save articles to see them here'
                      : 'No articles in the database for the last 24 hours — click Refresh to fetch the latest'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Articles Grid */}
            {!state.loading && !state.error && filteredArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredArticles.map((article, index) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isSaved={state.savedIds.has(article.id)}
                      onSave={handleSave}
                      onClick={handleArticleClick}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* End of list */}
            {!state.loading && filteredArticles.length > 0 && (
              <div className="flex justify-center py-8">
                <p className="text-xs text-muted-foreground">
                  {filteredArticles.length} articles from the last 24 hours
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>Powered by AI</span>
            <span className="text-border">·</span>
            <span>Ethical Scraping</span>
            <span className="text-border">·</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>

      {/* Article Detail Modal */}
      <ArticleModal
        article={selectedArticle}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
