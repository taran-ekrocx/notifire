'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Wifi,
  Database,
  Moon,
  Sun,
  Loader2,
  Flame,
  Newspaper,
  AlertCircle,
  Clock,
  Activity,
  BookOpen,
  Download,
} from 'lucide-react';
import { useTheme } from 'next-themes';

type SourceTab = 'rss' | 'ailive' | 'trending' | 'saved' | 'docs';

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface NewsFeedState {
  articles: Article[];
  savedIds: Set<string>;
  loading: boolean;
  error: string | null;
  cacheHit: boolean;
  lastUpdated: Date | null;
  newArticlesCount: number;
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
    cacheHit: false,
    lastUpdated: null,
    newArticlesCount: 0,
    socialTrends: null,
  });

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchTimeRef = useRef<string | null>(null);

  // Fetch saved articles IDs
  const fetchSavedIds = useCallback(async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set(data.articles.map((a: Article) => a.id));
        setState((prev) => ({ ...prev, savedIds: ids }));
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch articles — now retrieves ALL 24h articles (no page/limit)
  const fetchArticles = useCallback(
    async (isAutoRefresh: boolean = false) => {
      // Docs tab doesn't fetch articles
      if (activeTab === 'docs') return;

      setState((prev) => ({ ...prev, loading: !isAutoRefresh, error: null }));

      try {
        let articles: Article[] = [];
        let cacheHit = false;

        if (activeTab === 'rss' || activeTab === 'ailive') {
          const categoryParam = activeCategory === 'all' ? 'all' : activeCategory;
          // No limit param = get ALL 24h articles
          const params = new URLSearchParams({
            category: categoryParam,
            withImages: 'true',
          });
          // For auto-refresh, use incremental `since` param
          if (isAutoRefresh && lastFetchTimeRef.current) {
            params.set('since', lastFetchTimeRef.current);
          }
          // Force refresh on auto-refresh to bypass cache
          if (isAutoRefresh) {
            params.set('refresh', 'true');
          }

          const res = await fetch(`/api/news?${params}`);
          if (!res.ok) throw new Error('Failed to fetch news');
          const data = await res.json();
          articles = data.articles || [];
          cacheHit = data.cacheHit || false;
          lastFetchTimeRef.current = data.lastUpdated || new Date().toISOString();
        } else if (activeTab === 'trending') {
          const res = await fetch('/api/trending');
          if (!res.ok) throw new Error('Failed to fetch trending');
          const data = await res.json();
          articles = data.articles || [];
          cacheHit = true;
          // Store social trends data
          if (data.socialTrends) {
            setState(prev => ({
              ...prev,
              socialTrends: data.socialTrends,
            }));
          }
        } else if (activeTab === 'saved') {
          const res = await fetch('/api/saved');
          if (!res.ok) throw new Error('Failed to fetch saved');
          const data = await res.json();
          articles = data.articles || [];
          cacheHit = true;
        }

        // Filter to only 24h articles on client side as well (safety net)
        const cutoff = Date.now() - TWENTY_FOUR_HOURS;
        const recentArticles = (activeTab === 'saved')
          ? articles // saved articles don't need 24h filter
          : articles.filter(a => {
              const pubTime = new Date(a.publishedAt).getTime();
              return !isNaN(pubTime) && pubTime >= cutoff;
            });

        if (isAutoRefresh && (activeTab === 'rss' || activeTab === 'ailive')) {
          // Merge new articles with existing ones (dedup by URL)
          setState((prev) => {
            const existingUrls = new Set(prev.articles.map(a => a.url));
            const trulyNew = recentArticles.filter(a => !existingUrls.has(a.url));
            if (trulyNew.length === 0) return { ...prev, loading: false };

            const merged = [...trulyNew, ...prev.articles];
            // Re-apply 24h filter on merged list
            const mergedRecent = merged.filter(a => {
              const pubTime = new Date(a.publishedAt).getTime();
              return !isNaN(pubTime) && pubTime >= cutoff;
            });

            return {
              ...prev,
              articles: mergedRecent,
              newArticlesCount: prev.newArticlesCount + trulyNew.length,
              loading: false,
              lastUpdated: new Date(),
              cacheHit: false,
              error: null,
            };
          });
        } else {
          setState((prev) => ({
            ...prev,
            articles: recentArticles,
            cacheHit,
            loading: false,
            lastUpdated: new Date(),
            error: null,
            newArticlesCount: 0,
          }));
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load articles',
        }));
      }
    },
    [activeTab, activeCategory]
  );
useEffect(() => {
  setMounted(true);
}, []);

// Initial fetch & tab/category change
useEffect(() => {
    lastFetchTimeRef.current = null; // reset incremental tracking
    fetchArticles(false);
    fetchSavedIds();
  }, [fetchArticles, fetchSavedIds]);

  // Auto-refresh every 5 minutes for RSS and AI Live tabs
  useEffect(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }

    if (activeTab === 'rss' || activeTab === 'ailive') {
      autoRefreshRef.current = setInterval(() => {
        fetchArticles(true); // incremental refresh
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [activeTab, fetchArticles]);

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
        // Revert on error
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

  // Open article detail
  const handleArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
    setModalOpen(true);
  }, []);

  // Refresh (full, not incremental)
  const handleRefresh = useCallback(() => {
    lastFetchTimeRef.current = null;
    setState((prev) => ({ ...prev, newArticlesCount: 0 }));
    fetchArticles(false);
  }, [fetchArticles]);

  // Dismiss new articles notification
  const handleDismissNew = useCallback(() => {
    setState((prev) => ({ ...prev, newArticlesCount: 0 }));
  }, []);

  // Filter articles by search query
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

  const formatAutoRefresh = () => {
    const mins = AUTO_REFRESH_INTERVAL / 60000;
    return `Auto-refresh every ${mins}min`;
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

              {/* Live indicator — always on for RSS/AI Live */}
              {(activeTab === 'rss' || activeTab === 'ailive') && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-green-500" />
                  </span>
                  <span className="text-xs font-medium text-green-500 hidden sm:inline">Live</span>
                </motion.div>
              )}

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

      {/* New articles notification bar */}
      <AnimatePresence>
        {state.newArticlesCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={() => { handleRefresh(); }}
              className="w-full bg-violet-500/10 border-b border-violet-500/20 text-violet-500 text-xs font-medium py-2 px-4 flex items-center justify-center gap-2 hover:bg-violet-500/20 transition-colors"
            >
              <Activity className="size-3" />
              <span>{state.newArticlesCount} new article{state.newArticlesCount > 1 ? 's' : ''} available</span>
              <span className="text-violet-400">— Click to refresh</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Docs tab — full documentation panel */}
          <TabsContent value="docs" className="mt-4">
            <DocsPanel />
          </TabsContent>

          {/* Trending tab — social trends panel + articles */}
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

            {/* Trending articles grid */}
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

          {/* All other tabs share same content area */}
          <TabsContent value={activeTab === 'docs' ? 'rss' : (activeTab === 'trending' ? 'rss' : activeTab)} className="mt-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between gap-3 mb-4 px-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {(activeTab === 'rss' || activeTab === 'ailive') ? (
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>Last 24h</span>
                  </div>
                ) : state.cacheHit ? (
                  <div className="flex items-center gap-1">
                    <Database className="size-3" />
                    <span>Cached</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Wifi className="size-3" />
                    <span>Live</span>
                  </div>
                )}
                <span className="text-border">·</span>
                <span>Updated {formatLastUpdated(state.lastUpdated)}</span>
                <span className="text-border">·</span>
                <span>{filteredArticles.length} articles</span>
                {(activeTab === 'rss' || activeTab === 'ailive') && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-green-500 hidden sm:inline">{formatAutoRefresh()}</span>
                  </>
                )}
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
                      : 'No articles published in the last 24 hours for this category'}
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

            {/* End of list indicator */}
            {!state.loading && filteredArticles.length > 0 && (
              <div className="flex justify-center py-8">
                <p className="text-xs text-muted-foreground">
                  {filteredArticles.length} articles from the last 24 hours · Auto-refreshes every 5 min
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
