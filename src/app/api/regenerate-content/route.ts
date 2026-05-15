// src/app/api/regenerate-content/route.ts
// Regenerate article content and image using Gemini AI

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBLi67n5C6wxFDDVc_Q-jfaelZr3kMEW6s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Dynamically import cheerio to avoid edge-runtime issues
    const { load } = await import('cheerio');
    const $ = load(html);
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    return paragraphs.join('\n\n').slice(0, 15000) || null;
  } catch {
    return null;
  }
}

async function regenerateWithGemini(
  title: string,
  description: string,
  rawContent: string
): Promise<string | null> {
  try {
    const prompt = `You are a professional tech journalist. Based on the raw scraped content below, rewrite and enhance the article in a clear, engaging, well-structured format. Preserve all key facts, quotes, and insights from the original. Write in flowing paragraphs — no markdown, no headers, no bullet points. Output plain text only.

Title: ${title}
Description: ${description}
Raw Content:
${rawContent.slice(0, 12000)}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
      }),
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, url, title, description, category, tags } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'url and title are required' }, { status: 400 });
    }

    // Step 1: Scrape the article
    let rawContent: string | null = null;

    if (articleId) {
      const db = await getDb();
      const dbArticle = await db.article.findUnique({ where: { id: articleId } });
      rawContent = dbArticle?.content || null;
    }

    if (!rawContent) {
      rawContent = await scrapeUrl(url);
    }

    if (!rawContent) {
      return NextResponse.json({ error: 'Could not fetch article content' }, { status: 422 });
    }

    // Step 2: Regenerate content with Gemini
    const regeneratedContent = await regenerateWithGemini(title, description || '', rawContent);
    const finalContent = regeneratedContent || rawContent;

    // Step 3: Regenerate image via Pollinations AI
    const imagePrompt = `Tech news illustration: ${title}. ${(tags || []).slice(0, 3).join(', ')}. ${category || 'technology'}. Modern, clean, digital art style.`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=630&nologo=true&seed=${Date.now()}`;

    // Step 4: Persist to DB
    try {
      const db = await getDb();
      const updateData: Record<string, unknown> = {
        content: finalContent,
        scrapedAt: new Date(),
        aiImageUrl: imageUrl,
      };
      if (articleId) {
        await db.article.update({ where: { id: articleId }, data: updateData });
      } else {
        await db.article.updateMany({ where: { url }, data: updateData });
      }
    } catch {
      // Non-fatal — still return the data
    }

    return NextResponse.json({ success: true, content: finalContent, imageUrl });
  } catch (error) {
    console.error('[regenerate-content]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
