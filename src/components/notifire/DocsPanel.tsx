'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Layers,
  Database,
  Cpu,
  Rss,
  Brain,
  Server,
  GitBranch,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Search,
  FileText,
  ImageIcon,
  Zap,
  Activity,
  Clock,
  Hash,
  Code2,
  Globe,
  Lock,
  Box,
  Workflow,
  Monitor,
  ServerCog,
  Plug,
  MessageSquare,
  TrendingUp,
  Eye,
} from 'lucide-react';

// ─── Data: Tech Stack ────────────────────────────────────────────────

interface StackItem {
  name: string;
  version?: string;
  purpose: string;
  icon: React.ReactNode;
  color: string;
}

const FRONTEND_STACK: StackItem[] = [
  { name: 'Next.js 16', version: '16.x', purpose: 'App Router, RSC, API Routes, ISR', icon: <Globe className="size-4" />, color: '#000' },
  { name: 'React 19', version: '19.x', purpose: 'UI library with hooks, concurrent features', icon: <Box className="size-4" />, color: '#61dafb' },
  { name: 'TypeScript 5', version: '5.x', purpose: 'Strict typing throughout the codebase', icon: <Code2 className="size-4" />, color: '#3178c6' },
  { name: 'Tailwind CSS 4', version: '4.x', purpose: 'Utility-first CSS with theme variables', icon: <Layers className="size-4" />, color: '#06b6d4' },
  { name: 'shadcn/ui', purpose: 'Radix-based component library (NY style)', icon: <Box className="size-4" />, color: '#000' },
  { name: 'Framer Motion', version: '12.x', purpose: 'Animations, transitions, AnimatePresence', icon: <Zap className="size-4" />, color: '#ff69b4' },
  { name: 'Lucide React', purpose: 'Icon library (30+ icons used)', icon: <Eye className="size-4" />, color: '#f56565' },
  { name: 'next-themes', purpose: 'Dark/light mode with system detection', icon: <Sparkles className="size-4" />, color: '#8b5cf6' },
];

const BACKEND_STACK: StackItem[] = [
  { name: 'Next.js API Routes', purpose: '8 REST endpoints (GET/POST/PUT/DELETE)', icon: <Server className="size-4" />, color: '#000' },
  { name: 'Prisma ORM', version: '7.x', purpose: 'Type-safe DB queries with driver adapters', icon: <Database className="size-4" />, color: '#2d3748' },
  { name: 'PGlite (PostgreSQL WASM)', version: '0.4.x', purpose: 'Embedded PostgreSQL, no server needed', icon: <Database className="size-4" />, color: '#336791' },
  { name: '@prisma/adapter-pg + pg', version: '7.x', purpose: 'Real PostgreSQL adapter for production', icon: <Database className="size-4" />, color: '#336791' },
  { name: 'z-ai-web-dev-sdk', version: '0.0.17', purpose: 'AI: LLM, scraping, image gen, web search', icon: <Brain className="size-4" />, color: '#8b5cf6' },
  { name: 'rss-parser', version: '3.x', purpose: 'RSS/Atom feed fetching & parsing', icon: <Rss className="size-4" />, color: '#ee802f' },
];

const AI_CAPABILITIES: StackItem[] = [
  { name: 'LLM Chat Completions', purpose: 'AI summarization, key points, sentiment, drafts', icon: <Brain className="size-4" />, color: '#8b5cf6' },
  { name: 'Page Reader', purpose: 'Web scraping via z-ai SDK (full article extraction)', icon: <Search className="size-4" />, color: '#10b981' },
  { name: 'Image Generation', purpose: 'AI-generated article illustrations (not copied)', icon: <ImageIcon className="size-4" />, color: '#f59e0b' },
  { name: 'Web Search', purpose: 'Social trending: Reddit, Twitter/X, HackerNews', icon: <Search className="size-4" />, color: '#1da1f2' },
];

// ─── Data: Architecture ──────────────────────────────────────────────

interface FlowStep {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const DATA_PIPELINE: FlowStep[] = [
  { label: 'RSS Feeds', description: '15+ sources across 7 categories fetched in parallel', icon: <Rss className="size-5" />, color: '#ee802f' },
  { label: 'Category Tagger', description: 'Keyword-based detection → 7 tech categories', icon: <Hash className="size-5" />, color: '#06b6d4' },
  { label: 'Deduplicator', description: 'Jaccard similarity (0.7 threshold) + URL matching', icon: <Layers className="size-5" />, color: '#10b981' },
  { label: 'Social Signals', description: 'Reddit, Twitter/X, HackerNews trending topics matched', icon: <Search className="size-5" />, color: '#1da1f2' },
{
  label: 'Trending Detection',
  description:
    'Trending articles detected using Google, Twitter/X, Reddit and HackerNews discussion signals',
  icon: <Activity className="size-5" />,
  color: '#f59e0b',
},  { label: '24h Filter', description: 'Only articles published within last 24 hours', icon: <Clock className="size-5" />, color: '#ef4444' },
  { label: 'DB Persist', description: 'Upsert to PostgreSQL (PGlite or real PG) with full metadata', icon: <Database className="size-5" />, color: '#336791' },
  { label: 'AI Enrichment', description: 'On-demand: scrape → summarize → generate image', icon: <Brain className="size-5" />, color: '#8b5cf6' },
];

const ON_DEMAND_PIPELINE: FlowStep[] = [
  { label: 'User Clicks Card', description: 'ArticleModal opens → triggers /api/detail', icon: <Zap className="size-5" />, color: '#f59e0b' },
  { label: 'Check DB Cache', description: 'If summary exists in DB, return immediately', icon: <Database className="size-5" />, color: '#336791' },
  { label: 'Scrape Article', description: 'z-ai page_reader extracts full HTML content', icon: <Search className="size-5" />, color: '#10b981' },
  { label: 'AI Summarize', description: 'LLM generates summary, key points, sentiment, drafts', icon: <Brain className="size-5" />, color: '#8b5cf6' },
  { label: 'Generate Image', description: 'AI illustration inspired by article (no copyright images)', icon: <ImageIcon className="size-5" />, color: '#f59e0b' },
  { label: 'Save to DB', description: 'Persist summary, key points, sentiment, image, read time', icon: <Database className="size-5" />, color: '#336791' },
  { label: 'Return to User', description: 'Full ArticleDetail with LinkedIn & email drafts', icon: <FileText className="size-5" />, color: '#06b6d4' },
];

// ─── Data: API Endpoints ─────────────────────────────────────────────

interface Endpoint {
  method: string;
  path: string;
  description: string;
  params?: string;
  methodColor: string;
}

const API_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/news', description: 'Fetch all 24h articles from RSS feeds, with caching & incremental updates', params: 'category, page, limit, withImages, refresh, since', methodColor: 'bg-green-500/15 text-green-500' },
  { method: 'GET', path: '/api/trending', description: 'Trending articles + source/category distribution + social signals', methodColor: 'bg-green-500/15 text-green-500' },
  { method: 'POST', path: '/api/detail', description: 'On-demand scrape + AI summarize for a single article', params: 'title, url, description, source', methodColor: 'bg-blue-500/15 text-blue-500' },
  { method: 'POST', path: '/api/scrape', description: 'Scrape single URL using z-ai page_reader', params: 'url, summarize (bool)', methodColor: 'bg-blue-500/15 text-blue-500' },
  { method: 'PUT', path: '/api/scrape', description: 'Batch scrape up to 10 URLs with concurrency control', params: 'urls (array)', methodColor: 'bg-amber-500/15 text-amber-500' },
  { method: 'POST', path: '/api/summarize', description: 'AI summarize article (with optional scrape-first)', params: 'url, title, description, source, scrapeFirst', methodColor: 'bg-blue-500/15 text-blue-500' },
  { method: 'POST', path: '/api/generate-image', description: 'Generate AI illustration for single article', params: 'articleId, title, description, category, tags', methodColor: 'bg-blue-500/15 text-blue-500' },
  { method: 'PUT', path: '/api/generate-image', description: 'Batch generate AI images (max 5)', params: 'articles (array)', methodColor: 'bg-amber-500/15 text-amber-500' },
  { method: 'GET', path: '/api/saved', description: 'Get all saved/bookmarked articles', methodColor: 'bg-green-500/15 text-green-500' },
  { method: 'POST', path: '/api/saved', description: 'Save/bookmark an article', params: 'articleId', methodColor: 'bg-blue-500/15 text-blue-500' },
  { method: 'DELETE', path: '/api/saved', description: 'Remove saved bookmark', params: 'articleId', methodColor: 'bg-red-500/15 text-red-500' },
];

// ─── Data: RSS Sources ───────────────────────────────────────────────

interface SourceInfo {
  category: string;
  emoji: string;
  color: string;
  sources: string[];
}

const RSS_SOURCES_INFO: SourceInfo[] = [
  { category: 'AI', emoji: '🤖', color: '#8b5cf6', sources: ['TechCrunch AI', 'VentureBeat AI', 'Ars Technica', 'MIT Tech Review'] },
  { category: 'Cybersecurity', emoji: '🔐', color: '#ef4444', sources: ['The Hacker News', 'Krebs on Security', 'Dark Reading', 'Schneier on Security'] },
  { category: 'Cloud', emoji: '☁️', color: '#3b82f6', sources: ['AWS Blog', 'The New Stack'] },
  { category: 'Databases', emoji: '🗄️', color: '#10b981', sources: ['PostgreSQL.org', 'The New Stack', 'Redis Blog'] },
  { category: 'Infrastructure', emoji: '⚙️', color: '#f59e0b', sources: ['Kubernetes Blog', 'DevOps.com', 'The New Stack', 'InfoQ'] },
  { category: 'DevOps', emoji: '🚀', color: '#ec4899', sources: ['DevOps.com', 'InfoQ', 'HashiCorp Blog'] },
  { category: 'Startup', emoji: '💡', color: '#06b6d4', sources: ['TechCrunch Startups', 'Hacker News (YC)'] },
];

// ─── Data: Database Schema ───────────────────────────────────────────

interface SchemaField {
  name: string;
  type: string;
  description: string;
  isPrimary?: boolean;
  isUnique?: boolean;
  isIndexed?: boolean;
}

const ARTICLE_SCHEMA: SchemaField[] = [
  { name: 'id', type: 'String @id', description: 'CUID auto-generated', isPrimary: true },
  { name: 'title', type: 'String', description: 'Article headline' },
  { name: 'url', type: 'String @unique', description: 'Canonical URL (dedup key)', isUnique: true },
  { name: 'description', type: 'String', description: 'Short snippet from RSS' },
  { name: 'imageUrl', type: 'String?', description: 'Original source image URL (metadata only)' },
  { name: 'aiImageUrl', type: 'String?', description: 'AI-generated illustration path' },
  { name: 'source', type: 'String', description: 'Publisher name' },
  { name: 'author', type: 'String?', description: 'Article author' },
  { name: 'publishedAt', type: 'DateTime', description: 'Publication timestamp', isIndexed: true },
  { name: 'category', type: 'String', description: 'Category tag (7 values)', isIndexed: true },
  { name: 'tags', type: 'String', description: 'JSON array of keyword tags' },
  { name: 'content', type: 'String?', description: 'Full scraped article text' },
  { name: 'summary', type: 'String?', description: 'AI-generated summary' },
  { name: 'keyPoints', type: 'String', description: 'JSON array of AI key points' },
  { name: 'readTimeMin', type: 'Int', description: 'Estimated read time' },
  { name: 'sentiment', type: 'String', description: 'positive / neutral / negative' },
  { name: 'scrapedAt', type: 'DateTime?', description: 'When article was scraped' },
  { name: 'summarizedAt', type: 'DateTime?', description: 'When AI summary was generated' },
  { name: 'createdAt', type: 'DateTime', description: 'Record creation time' },
  { name: 'updatedAt', type: 'DateTime', description: 'Last update time' },
];

// ─── Section Component ───────────────────────────────────────────────

function Section({
  id,
  title,
  icon,
  color,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 group mb-3"
      >
        <div
          className="size-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-left flex-1">{title}</h2>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-11 pb-6 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stack Card ──────────────────────────────────────────────────────

function StackCard({ item }: { item: StackItem }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 transition-colors">
      <div
        className="size-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${item.color}20`, color: item.color }}
      >
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.name}</span>
          {item.version && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
              {item.version}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{item.purpose}</p>
      </div>
    </div>
  );
}

// ─── Flow Diagram ────────────────────────────────────────────────────

function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3 relative">
          {/* Vertical line connector */}
          {i < steps.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border/50" />
          )}
          {/* Step circle */}
          <div
            className="size-[30px] rounded-full flex items-center justify-center shrink-0 z-10 border-2"
            style={{
              backgroundColor: `${step.color}15`,
              borderColor: `${step.color}40`,
              color: step.color,
            }}
          >
            <span className="text-xs font-bold">{i + 1}</span>
          </div>
          {/* Step content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              {step.icon}
              <span className="font-medium text-sm">{step.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-7">{step.description}</p>
          </div>
          {/* Arrow */}
          {i < steps.length - 1 && (
            <div className="absolute left-[11px] top-8">
              <ArrowRight className="size-2 text-muted-foreground/30 rotate-90" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── DB Mode Card ────────────────────────────────────────────────────

function DBModeCard({
  mode,
  icon,
  title,
  subtitle,
  adapter,
  useCase,
  envVars,
  color,
}: {
  mode: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  adapter: string;
  useCase: string;
  envVars: string[];
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-start gap-2">
          <Plug className="size-3 mt-0.5 text-muted-foreground shrink-0" />
          <span><strong>Adapter:</strong> <code className="font-mono text-[10px] bg-muted/50 px-1 rounded">{adapter}</code></span>
        </div>
        <div className="flex items-start gap-2">
          <Monitor className="size-3 mt-0.5 text-muted-foreground shrink-0" />
          <span><strong>Use case:</strong> {useCase}</span>
        </div>
        <div className="flex items-start gap-2">
          <Lock className="size-3 mt-0.5 text-muted-foreground shrink-0" />
          <span><strong>Env:</strong> {envVars.map((v, i) => (
            <code key={i} className="font-mono text-[10px] bg-muted/50 px-1 rounded ml-1">{v}</code>
          ))}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function DocsPanel() {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="max-w-4xl mx-auto space-y-2 pr-2">
        {/* Hero Banner */}
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <BookOpen className="size-5 text-violet-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Notifire.in Documentation</h1>
                <p className="text-sm text-muted-foreground">Real-time Tech Intelligence Platform</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Notifire.in is a <strong>Real-time Tech Intelligence Platform</strong> that aggregates, analyzes, and delivers
              tech news from 15+ RSS sources across 7 categories. It uses AI to summarize articles,
              detect trending stories via social signals (Reddit, Twitter/X, HackerNews), generate unique illustrations,
              and provide actionable content drafts — all within a 24-hour rolling window.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'RSS Sources', value: '15+', icon: <Rss className="size-3.5" />, color: '#ee802f' },
                { label: 'Categories', value: '7', icon: <Hash className="size-3.5" />, color: '#06b6d4' },
                { label: 'API Endpoints', value: '11', icon: <Server className="size-3.5" />, color: '#336791' },
                { label: 'AI Skills', value: '4', icon: <Brain className="size-3.5" />, color: '#8b5cf6' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                  <div className="size-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Overview ─────────────────────────────────────── */}
        <Section id="overview" title="How It Works" icon={<Zap className="size-4" />} color="#f59e0b">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Fetch', desc: 'RSS feeds fetched on user refresh across 15+ sources + social signals from Reddit, Twitter/X, HackerNews', icon: <Rss className="size-4" />, color: '#ee802f' },
              { label: 'Process', desc: 'Tag → Deduplicate → Social Match → Score → Filter 24h → Persist', icon: <Workflow className="size-4" />, color: '#10b981' },
              { label: 'Enrich', desc: 'On-demand: scrape → AI summary → generate image → save', icon: <Brain className="size-4" />, color: '#8b5cf6' },
            ].map((item) => (
              <Card key={item.label} className="border-border/30 bg-card/50">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-sm">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/30 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Key principle:</strong> The app never displays raw source images.
            Instead, it generates unique AI illustrations inspired by the article content — avoiding copyright
            issues while providing visually rich cards. Source images are stored as metadata only.
          </div>
        </Section>

        {/* ── Data Pipeline Flow ───────────────────────────── */}
        <Section id="pipeline" title="Data Pipeline" icon={<Activity className="size-4" />} color="#10b981">
          <p className="text-xs text-muted-foreground mb-3">
            On user refresh, the full pipeline executes to fetch, process, and store all articles
            published within the last 24 hours:
          </p>
          <FlowDiagram steps={DATA_PIPELINE} />
          <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-muted-foreground">
            <strong className="text-amber-500">Social signals step:</strong> Reddit hot posts (top 2 subreddits per category),
            Twitter/X web search (per category), and HackerNews top 15 stories are fetched in parallel.
            Articles matching social trends receive a 0–25 score boost.
          </div>
        </Section>

        {/* ── On-Demand Pipeline ───────────────────────────── */}
        <Section id="ondemand" title="On-Demand Enrichment" icon={<Brain className="size-4" />} color="#8b5cf6" defaultOpen={false}>
          <p className="text-xs text-muted-foreground mb-3">
            When a user clicks an article card, the modal triggers an on-demand enrichment pipeline:
          </p>
          <FlowDiagram steps={ON_DEMAND_PIPELINE} />
          <div className="mt-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-xs text-muted-foreground">
            <strong className="text-violet-400">AI Output includes:</strong> Full summary, 5 key points, read time,
            sentiment (positive/neutral/negative), 4 related topics, LinkedIn post draft, and email newsletter draft.
          </div>
        </Section>

        {/* ── Dual Database Mode ──────────────────────────── */}
        <Section id="database-modes" title="Database Modes" icon={<Database className="size-4" />} color="#336791">
          <p className="text-xs text-muted-foreground mb-3">
            Notifire.in supports two database backends, controlled by the <code className="font-mono text-[10px] bg-muted/50 px-1 rounded">USE_LOCAL_POSTGRES</code> environment variable:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DBModeCard
              mode="embedded"
              icon={<Monitor className="size-4" />}
              title="PGlite (Embedded)"
              subtitle="Default — no external DB needed"
              adapter="pglite-prisma-adapter"
              useCase="Cloud sandbox, development, zero-config deployment"
              envVars={['USE_LOCAL_POSTGRES=false (default)', 'DATABASE_DIR=./.pgdata']}
              color="#336791"
            />
            <DBModeCard
              mode="local"
              icon={<ServerCog className="size-4" />}
              title="Real PostgreSQL"
              subtitle="Production — connect to external PG server"
              adapter="@prisma/adapter-pg + pg Pool"
              useCase="Local development with PostgreSQL, production hosting"
              envVars={['USE_LOCAL_POSTGRES=true', 'DATABASE_URL=postgresql://...']}
              color="#10b981"
            />
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/30 text-xs text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> <code className="font-mono text-[10px] bg-muted/50 px-1 rounded">src/lib/db.ts</code> exports an async
            <code className="font-mono text-[10px] bg-muted/50 px-1 rounded ml-1">getDb()</code> function that returns a PrismaClient. The correct adapter
            is selected at runtime based on the env var. Both modes use the same Prisma schema
            (<code className="font-mono text-[10px] bg-muted/50 px-1 rounded">provider = "postgres"</code>) and the same query interface.
          </div>
        </Section>

        {/* ── Social Signals ───────────────────────────────── */}
        <Section id="social" title="Social Trending Signals" icon={<TrendingUp className="size-4" />} color="#1da1f2" defaultOpen={false}>
          <p className="text-xs text-muted-foreground mb-3">
            Notifire.in enriches trend scores with real-time social signals from 3 platforms:
          </p>
          <div className="space-y-2">
            {[
              {
                platform: 'Reddit',
                icon: <MessageSquare className="size-4" />,
                color: '#ff4500',
                desc: 'Hot posts from 2 subreddits per category (28 total subreddits). Scores normalized via log-scale upvotes.',
                subs: 'r/artificial, r/MachineLearning, r/netsec, r/aws, r/PostgreSQL, r/kubernetes, r/devops, r/startups...',
              },
              {
                platform: 'Twitter/X',
                icon: <Search className="size-4" />,
                color: '#1da1f2',
                desc: 'Web search via z-ai SDK with category-specific trending queries filtered to last 24h.',
                subs: 'Queries like "trending AI LLM GPT site:twitter.com" per category',
              },
              {
                platform: 'HackerNews',
                icon: <TrendingUp className="size-4" />,
                color: '#ff6600',
                desc: 'Top 15 stories from Firebase API. Only stories with score ≥ 50 are included. Covers startup/tech categories.',
                subs: 'Global feed — not category-specific',
              },
            ].map((item) => (
              <div key={item.platform} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="size-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <span className="font-medium text-sm">{item.platform}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">{item.subs}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground">
            <strong className="text-blue-400">Matching logic:</strong> Articles are matched to social topics via
            Jaccard title similarity (0.3 threshold), tag overlap (≥2 tags), or same-category with high topic score.
            Matched articles receive a 0–25 social boost based on multi-platform presence, mention count, and topic scores.
          </div>
        </Section>

        {/* ── Tech Stack ───────────────────────────────────── */}
        <Section id="techstack" title="Tech Stack" icon={<Layers className="size-4" />} color="#06b6d4">
          {/* Frontend */}
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Globe className="size-3.5 text-cyan-500" /> Frontend
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {FRONTEND_STACK.map((item) => (
              <StackCard key={item.name} item={item} />
            ))}
          </div>

          {/* Backend */}
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Server className="size-3.5 text-green-500" /> Backend
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {BACKEND_STACK.map((item) => (
              <StackCard key={item.name} item={item} />
            ))}
          </div>

          {/* AI */}
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Brain className="size-3.5 text-violet-500" /> AI Capabilities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AI_CAPABILITIES.map((item) => (
              <StackCard key={item.name} item={item} />
            ))}
          </div>
        </Section>

        {/* ── API Endpoints ────────────────────────────────── */}
        <Section id="api" title="API Endpoints" icon={<Server className="size-4" />} color="#336791">
          <div className="space-y-2">
            {API_ENDPOINTS.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <Badge className={`text-[10px] font-mono font-bold px-2 shrink-0 ${ep.methodColor}`}>
                  {ep.method}
                </Badge>
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono font-semibold text-foreground">{ep.path}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{ep.description}</p>
                  {ep.params && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ep.params.split(', ').map((p) => (
                        <Badge key={p} variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── RSS Sources ──────────────────────────────────── */}
        <Section id="sources" title="News Sources" icon={<Rss className="size-4" />} color="#ee802f">
          <p className="text-xs text-muted-foreground mb-3">
            15+ RSS feeds organized by category, each with an authority score (0–1) used in trending calculations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RSS_SOURCES_INFO.map((cat) => (
              <div key={cat.category} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="font-medium text-sm" style={{ color: cat.color }}>{cat.category}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{cat.sources.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cat.sources.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Database Schema ──────────────────────────────── */}
        <Section id="database" title="Database Schema" icon={<Database className="size-4" />} color="#336791" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm">Article</h3>
                <Badge variant="secondary" className="text-[10px]">Primary Model</Badge>
              </div>
              <div className="rounded-lg border border-border/30 overflow-hidden overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/30">
                      <th className="text-left p-2 font-medium">Field</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ARTICLE_SCHEMA.map((field) => (
                      <tr key={field.name} className="border-b border-border/10 hover:bg-muted/20">
                        <td className="p-2 font-mono whitespace-nowrap">
                          <span className="text-foreground">{field.name}</span>
                          <span className="ml-1">
                            {field.isPrimary && <Badge className="text-[8px] bg-amber-500/15 text-amber-500 px-1 py-0 h-3.5">PK</Badge>}
                            {field.isUnique && <Badge className="text-[8px] bg-violet-500/15 text-violet-500 px-1 py-0 h-3.5">UQ</Badge>}
                            {field.isIndexed && <Badge className="text-[8px] bg-cyan-500/15 text-cyan-500 px-1 py-0 h-3.5">IDX</Badge>}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground font-mono whitespace-nowrap">{field.type}</td>
                        <td className="p-2 text-muted-foreground hidden sm:table-cell">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-semibold text-sm mb-1">SavedArticle</h4>
                <p className="text-[11px] text-muted-foreground mb-2">Bookmark many-to-one → Article</p>
                <div className="space-y-1 text-xs font-mono">
                  <div>id <span className="text-amber-500">PK</span></div>
                  <div>articleId <span className="text-violet-500">FK → Article.id</span></div>
                  <div>createdAt</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <h4 className="font-semibold text-sm mb-1">ScrapeJob</h4>
                <p className="text-[11px] text-muted-foreground mb-2">Async job tracking for batch scraping</p>
                <div className="space-y-1 text-xs font-mono">
                  <div>id <span className="text-amber-500">PK</span></div>
                  <div>url</div>
                  <div>status <span className="text-cyan-500">(pending|running|done|failed)</span></div>
                  <div>result, error</div>
                  <div>createdAt, updatedAt</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Caching & Performance ────────────────────────── */}
        <Section id="caching" title="Caching & Performance" icon={<Zap className="size-4" />} color="#f59e0b" defaultOpen={false}>
          <div className="space-y-2">
            {[
              { label: 'In-Memory Cache', desc: 'Map<string, {data, expiresAt}> with TTL. News: 5min, Trending: 5min, Social: 10min, Detail/Scrape: 1hr', color: '#10b981' },
              { label: 'ISR', desc: 'revalidate = 300s on /api/news route for stale-while-revalidate', color: '#3b82f6' },
              { label: 'DB-Level Cache', desc: 'Summaries & scraped content persisted to PostgreSQL — avoids re-scraping on repeat visits', color: '#336791' },
              { label: 'Image Disk Cache', desc: 'AI-generated images saved to /public/generated/ with MD5 hash filenames — never regenerated', color: '#f59e0b' },
              { label: 'Manual Refresh', desc: 'Refresh button triggers full RSS fetch + DB write; category/tab navigation reads from database directly', color: '#8b5cf6' },
              { label: '24h Rolling Window', desc: 'Server + client both filter articles to last 24h only, ensuring fresh content', color: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="size-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <span className="font-medium text-sm">{item.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Key Algorithms ───────────────────────────────── */}
        <Section id="algorithms" title="Key Algorithms" icon={<Cpu className="size-4" />} color="#ec4899" defaultOpen={false}>
          <div className="space-y-4">
            {/* Trending Score */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Activity className="size-4 text-amber-500" /> Trending Score (0–100)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 w-12 justify-center">0–25</Badge>
                  <span className="text-muted-foreground">Recency: max(0, 25 − hoursAgo × 0.4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 w-12 justify-center">0–15</Badge>
                  <span className="text-muted-foreground">Source Authority: authority × 15</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 w-12 justify-center">0–20</Badge>
                  <span className="text-muted-foreground">Cross-source Frequency: min(20, similarArticles × 8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 w-12 justify-center">0–15</Badge>
                  <span className="text-muted-foreground">Velocity Keywords: min(15, matches × 8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 w-12 justify-center">0–25</Badge>
                  <span className="text-muted-foreground">Social Boost: multi-platform + mentions + topic scores</span>
                </div>
              </div>
            </div>

            {/* Deduplication */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Layers className="size-4 text-green-500" /> Jaccard Similarity Deduplication
              </h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>1. Tokenize article titles: split by non-word chars, filter words {'>'} 3 chars</p>
                <p>2. Calculate Jaccard similarity: |A ∩ B| / |A ∪ B|</p>
                <p>3. If similarity {'>'} 0.7 or URLs match → mark as duplicate</p>
                <p>4. Generate deterministic ID from URL SHA-256 hash (first 12 chars)</p>
              </div>
              <div className="mt-2 p-2 rounded bg-background/50 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                <code>jaccardSimilarity(titleTokens, existingTokens) {'>'} 0.7</code>
              </div>
            </div>

            {/* Category Detection */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Hash className="size-4 text-cyan-500" /> Keyword-Based Category Detection
              </h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>1. Each category has 15-25 weighted keywords</p>
                <p>2. Count keyword matches in title + description + snippet</p>
                <p>3. Category with highest match count wins (fallback: &quot;ai&quot;)</p>
                <p>4. Top 5 matching keywords become article tags</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Project Structure ────────────────────────────── */}
        <Section id="structure" title="Project Structure" icon={<GitBranch className="size-4" />} color="#10b981" defaultOpen={false}>
          <div className="rounded-lg bg-muted/30 border border-border/30 p-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
            <pre className="text-muted-foreground">{`src/
├── app/
│   ├── layout.tsx          # Root layout (Geist font, Toaster, metadata)
│   ├── page.tsx            # Home → ThemeProvider + NewsFeed
│   ├── globals.css         # Tailwind 4 + shadcn theme variables
│   └── api/
│       ├── route.ts        # Health check endpoint
│       ├── news/route.ts   # GET: Main feed (RSS → cache → DB)
│       ├── trending/route.ts # GET: Trending articles + social signals
│       ├── detail/route.ts  # POST: On-demand scrape + summarize
│       ├── scrape/route.ts  # POST/PUT: Single/batch scrape
│       ├── summarize/route.ts # POST: AI summarize
│       ├── generate-image/route.ts # POST/PUT: AI image gen
│       └── saved/route.ts   # GET/POST/DELETE: Bookmarks
│
├── components/
│   ├── ui/                 # 50+ shadcn/ui components (Radix-based)
│   └── notifire/
│       ├── NewsFeed.tsx     # Main feed: tabs, categories, manual refresh
│       ├── ArticleCard.tsx  # Card with image, tags, trending badge
│       ├── ArticleModal.tsx # Detail modal: AI summary, drafts, scrape
│       ├── CategoryFilter.tsx # Category pill selector
│       ├── SearchBar.tsx    # Search input
│       ├── TrendingBadge.tsx # Hot/Rising badge (score-based)
│       └── DocsPanel.tsx    # Documentation tab (this panel)
│
├── lib/
│   ├── types.ts            # Category, Article, ArticleDetail, etc.
│   ├── db.ts               # Dual-mode DB (PGlite or real PostgreSQL)
│   ├── cache.ts            # In-memory TTL cache
│   ├── time-utils.ts       # formatTimeAgo()
│   ├── config/
│   │   └── rss-sources.ts  # 15+ RSS URLs by category + authority
│   ├── fetchers/
│   │   ├── rss.ts          # RSS parser (24h filter, no limit)
│   │   ├── aggregator.ts   # Orchestrates all sources → dedup → rank
│   │   ├── scraper.ts      # z-ai page_reader (single + batch)
│   │   ├── summarizer.ts   # z-ai LLM (full + quick summarize)
│   │   ├── imageGenerator.ts # z-ai image gen → /public/generated/
│   │   └── socialTrends.ts # Reddit + Twitter/X + HN trending
│   └── processors/
│       ├── categoryTagger.ts # Keyword detection + tag extraction
│       ├── deduplicator.ts   # Jaccard similarity dedup
│       └── trendingEngine.ts # Trend scoring + signal calculation
│
├── prisma/
│   └── schema.prisma       # Article, SavedArticle, ScrapeJob models
│
└── scripts/
    └── db-setup.ts          # PGlite DDL initialization script`}</pre>
          </div>
        </Section>

        {/* ── Environment Variables ────────────────────────── */}
        <Section id="env" title="Environment Variables" icon={<Lock className="size-4" />} color="#ef4444" defaultOpen={false}>
          <div className="space-y-2">
            {[
              { key: 'USE_LOCAL_POSTGRES', value: 'false', desc: 'Set "true" to use real PostgreSQL instead of PGlite', required: true },
              { key: 'DATABASE_DIR', value: './.pgdata', desc: 'PGlite filesystem persistence directory (only used when USE_LOCAL_POSTGRES=false)', required: false },
              { key: 'DATABASE_URL', value: 'postgresql://user:pass@host:5432/notifire', desc: 'PostgreSQL connection URL (required when USE_LOCAL_POSTGRES=true)', required: false },
            ].map((env) => (
              <div key={env.key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono font-semibold text-foreground">{env.key}</code>
                    {env.required && (
                      <Badge className="text-[8px] bg-red-500/15 text-red-500 px-1 py-0 h-3.5">Required</Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4">{env.value}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{env.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/30 text-xs text-muted-foreground">
            <strong className="text-foreground">Local Setup (Windows + PostgreSQL):</strong> Install PostgreSQL locally,
            create a database named <code className="font-mono text-[10px] bg-muted/50 px-1 rounded">notifire</code>,
            set <code className="font-mono text-[10px] bg-muted/50 px-1 rounded">USE_LOCAL_POSTGRES=true</code> and
            <code className="font-mono text-[10px] bg-muted/50 px-1 rounded ml-1">DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/notifire</code> in your
            <code className="font-mono text-[10px] bg-muted/50 px-1 rounded ml-1">.env.local</code> file. Then run
            <code className="font-mono text-[10px] bg-muted/50 px-1 rounded ml-1">npx prisma db push</code> to create tables.
          </div>
        </Section>

        {/* ── Frontend Tabs Explained ──────────────────────── */}
        <Section id="tabs" title="Frontend Tabs" icon={<Layers className="size-4" />} color="#8b5cf6" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { tab: '24h Feed', icon: '📡', desc: 'All articles from the last 24 hours across all RSS sources. Data read directly from the database; use the Refresh button to fetch the latest RSS articles.' },
              { tab: 'AI Live', icon: '⚡', desc: 'Same 24h feed with AI enrichment indicators. Shows which articles have AI-generated images, summaries, and analysis.' },
              { tab: 'Trending', icon: '🔥', desc: 'Articles sorted by trend score (0-100). Includes source velocity signals, social platform breakdown, and category distribution analytics.' },
              { tab: 'Saved', icon: '🔖', desc: 'User-bookmarked articles persisted in PostgreSQL. No 24h filter applied — saved articles persist indefinitely.' },
              { tab: 'Docs', icon: '📖', desc: 'This documentation panel. Covers architecture, data pipeline, tech stack, API, database, algorithms, and setup instructions.' },
            ].map((item) => (
              <div key={item.tab} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{item.icon}</span>
                  <span className="font-semibold text-sm">{item.tab}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 py-6 text-xs text-muted-foreground flex-wrap">
          <span>Built with Next.js 16</span>
          <span className="text-border">·</span>
          <span>Powered by z-ai-web-dev-sdk</span>
          <span className="text-border">·</span>
          <span>Prisma 7 + PostgreSQL</span>
          <span className="text-border">·</span>
          <span>AI-First Architecture</span>
        </div>
      </div>
    </ScrollArea>
  );
}
