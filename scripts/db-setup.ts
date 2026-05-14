// scripts/db-setup.ts
// Initialize the PGlite database with the Prisma schema
// Run with: bun run scripts/db-setup.ts

import { PGlite } from "@electric-sql/pglite";

const DATABASE_DIR = process.env.DATABASE_DIR || "/home/z/my-project/.pgdata";

async function main() {
  console.log(`[db-setup] Starting PGlite at ${DATABASE_DIR}...`);
  const db = new PGlite({ dataDir: DATABASE_DIR });
  await db.waitReady;
  console.log("[db-setup] PGlite ready");

  // Create the schema (PostgreSQL-compatible DDL)
  console.log("[db-setup] Creating tables...");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS "Article" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL DEFAULT '',
      "imageUrl" TEXT,
      "aiImageUrl" TEXT,
      "source" TEXT NOT NULL DEFAULT '',
      "author" TEXT,
      "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "category" TEXT NOT NULL DEFAULT 'ai',
      "tags" TEXT NOT NULL DEFAULT '[]',
      "content" TEXT,
      "summary" TEXT,
      "keyPoints" TEXT NOT NULL DEFAULT '[]',
      "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "readTimeMin" INTEGER NOT NULL DEFAULT 3,
      "sentiment" TEXT NOT NULL DEFAULT 'neutral',
      "scrapedAt" TIMESTAMP(3),
      "summarizedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "Article_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Article_url_key" UNIQUE ("url")
    );

    CREATE TABLE IF NOT EXISTS "SavedArticle" (
      "id" TEXT NOT NULL,
      "articleId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "SavedArticle_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE IF NOT EXISTS "ScrapeJob" (
      "id" TEXT NOT NULL,
      "url" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "result" TEXT,
      "error" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY ("id")
    );

    -- Foreign key
    DO $$ BEGIN
      ALTER TABLE "SavedArticle" ADD CONSTRAINT "SavedArticle_articleId_fkey"
        FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Indexes
    CREATE INDEX IF NOT EXISTS "Article_category_idx" ON "Article"("category");
    CREATE INDEX IF NOT EXISTS "Article_publishedAt_idx" ON "Article"("publishedAt");
    CREATE INDEX IF NOT EXISTS "Article_trendScore_idx" ON "Article"("trendScore");
  `);

  console.log("[db-setup] ✅ Schema created successfully!");

  // Verify
  const tables = await db.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  console.log("[db-setup] Tables:", tables.rows.map((r: any) => r.tablename));

  await db.close();
  console.log("[db-setup] Done!");
}

main().catch(err => {
  console.error("[db-setup] Fatal error:", err);
  process.exit(1);
});
