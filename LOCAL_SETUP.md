# Notifire.in — Local Setup Guide

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18+ | https://nodejs.org |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download/windows/ |
| **Git** | Latest | https://git-scm.com |
| **Bun** (optional) | 1+ | https://bun.sh |

> You can use either **npm** or **bun** as your package manager. Both work.

---

## Step 1: Extract the ZIP

Extract `notifire.zip` to any folder, e.g.:

```
C:\Projects\notifire
```

Open a terminal (PowerShell or CMD) and navigate to the folder:

```bash
cd C:\Projects\notifire
```

---

## Step 2: Create the PostgreSQL Database

Open **pgAdmin** or **psql** and create a database:

```sql
CREATE DATABASE notifire;
```

Or via psql command line:

```bash
psql -U postgres -c "CREATE DATABASE notifire;"
```

---

## Step 3: Configure Environment Variables

Open `.env.local` and update the PostgreSQL connection string:

```env
# Set to "true" to use your local PostgreSQL
USE_LOCAL_POSTGRES=true

# Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/notifire
```

**Common DATABASE_URL formats:**

| Setup | DATABASE_URL |
|-------|-------------|
| Default local PG | `postgresql://postgres:postgres@localhost:5432/notifire` |
| Custom password | `postgresql://postgres:mypassword@localhost:5432/notifire` |
| Custom user | `postgresql://myuser:mypass@localhost:5432/notifire` |
| Non-default port | `postgresql://postgres:postgres@localhost:5433/notifire` |

> **Note:** If you don't have PostgreSQL and want to use the embedded database (PGlite), set `USE_LOCAL_POSTGRES=false` and comment out `DATABASE_URL`. PGlite runs in-process — no external DB needed.

---

## Step 4: Install Dependencies

```bash
npm install
```

Or with Bun (faster):

```bash
bun install
```

---

## Step 5: Push Database Schema

This creates all tables (Article, SavedArticle, ScrapeJob) in your PostgreSQL database:

```bash
npx prisma db push
```

Or with Bun:

```bash
bunx prisma db push
```

You should see:

```
🚀  Your database is now in sync with your Prisma schema.
```

---

## Step 6: Start the Development Server

```bash
npm run dev
```

Or with Bun:

```bash
bun run dev
```

The app starts at **http://localhost:3000**

Open your browser and visit: **http://localhost:3000**

---

## Step 7: Verify It's Working

1. You should see the Notifire.in dashboard with a dark theme
2. Click **"24h Feed"** tab — articles should start loading from RSS sources
3. Click any article card — it triggers on-demand AI enrichment (scrape + summarize)
4. Click **"Trending"** tab — shows articles ranked by social signals (Reddit, Twitter/X, HackerNews)
5. Click **"Docs"** tab — shows the interactive documentation

---

## Troubleshooting

### "Connection refused" / PostgreSQL errors

- Make sure PostgreSQL service is running: `pg_isready`
- Verify your `DATABASE_URL` in `.env.local` matches your PostgreSQL credentials
- Check if PostgreSQL is listening on port 5432: `netstat -an | findstr 5432`
- If using a different port, update the URL accordingly

### "prisma db push" fails

- Ensure the `notifire` database exists: `psql -U postgres -c "\l"` (list databases)
- Make sure `prisma` is installed: `npx prisma --version`
- Try regenerating the client: `npx prisma generate`

### Port 3000 already in use

- Kill the process using port 3000 or start on a different port:
  ```bash
  npx next dev -p 3001
  ```

### RSS feeds not loading

- The app fetches from 15+ RSS sources — some may be temporarily down
- Check the browser console (F12) for errors
- The trending engine also fetches from Reddit and HackerNews APIs

### Want to use PGlite instead (no PostgreSQL needed)?

1. Edit `.env.local`:
   ```env
   USE_LOCAL_POSTGRES=false
   ```
2. Remove or comment out `DATABASE_URL`
3. Restart the dev server — PGlite will create a `.pgdata/` folder automatically

---

## Project Structure

```
notifire/
├── prisma/schema.prisma       # Database models
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   └── api/
│   │       ├── news/          # GET: RSS feed articles
│   │       ├── trending/      # GET: Trending + social signals
│   │       ├── detail/        # POST: On-demand scrape + AI
│   │       ├── scrape/        # POST/PUT: Article scraping
│   │       ├── summarize/     # POST: AI summarization
│   │       ├── generate-image/# POST/PUT: AI image gen
│   │       └── saved/         # GET/POST/DELETE: Bookmarks
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── notifire/          # App-specific components
│   └── lib/
│       ├── db.ts              # Dual-mode DB (PGlite or PostgreSQL)
│       ├── cache.ts           # In-memory TTL cache
│       ├── types.ts           # TypeScript types
│       ├── config/rss-sources.ts  # 15+ RSS feed URLs
│       ├── fetchers/          # RSS, scraper, summarizer, social trends
│       └── processors/        # Category tagger, deduplicator, trending engine
├── .env.local                 # Your configuration
└── package.json
```

---

## Switching Between PGlite and PostgreSQL

| Mode | USE_LOCAL_POSTGRES | External DB Required | Data Location |
|------|-------------------|---------------------|---------------|
| **PGlite** (default) | `false` | No | `.pgdata/` folder |
| **Local PostgreSQL** | `true` | Yes | Your PostgreSQL server |

To switch: edit `.env.local`, then restart the dev server.
