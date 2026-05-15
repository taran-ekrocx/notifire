-- Migration: Replace trendingOn/trendingCount with Gemini platform-wise trendSignals
ALTER TABLE "Article" ADD COLUMN "trendSignals" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Article" DROP COLUMN IF EXISTS "trendingOn";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "trendingCount";
