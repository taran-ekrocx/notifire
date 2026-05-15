-- Migration: Add Gemini AI auth verification fields to Article
ALTER TABLE "Article" ADD COLUMN "authConfidence" DOUBLE PRECISION;
ALTER TABLE "Article" ADD COLUMN "authCheckedAt" TIMESTAMP(3);
ALTER TABLE "Article" ADD COLUMN "authFlags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Article" ADD COLUMN "authReasoning" TEXT;
