// src/app/api/regenerate-content/route.ts
// Regenerate article content and image using Gemini AI

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBLi67n5C6wxFDDVc_Q-jfaelZr3kMEW6s';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string, maxTokens = 2048): Promise<string | null> {
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const { load } = await import('cheerio');
    const $ = load(html);
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    return paragraphs.join('\n\n').slice(0, 15000) || null;
  } catch {
    return null;
  }
}

async function regenerateContent(title: string, description: string, rawContent: string): Promise<string | null> {
  return callGemini(
    `You are a senior tech journalist. Based on the original article content below, produce a unique, optimized rewrite that:
- Opens with a compelling hook that captures the core news immediately
- Covers all key facts, data points, and quotes from the original
- Adds context to explain why this matters to tech readers
- Closes with a forward-looking insight or implication

Write in clear flowing paragraphs only — no markdown, no headers, no bullet points. 300–500 words. Plain text output only.

Title: ${title}
Description: ${description}
Original Content:
${rawContent.slice(0, 12000)}`,
    2048
  );
}

async function generateImagePrompt(title: string, description: string, content: string): Promise<string | null> {
  return callGemini(
    `Create a detailed image generation prompt for a professional editorial illustration for this tech news article. The prompt should describe the visual concept, style, colours, and composition in vivid detail. No text in the image. Output only the image prompt, nothing else.

Article title: ${title}
Article summary: ${description}
Key content: ${content.slice(0, 600)}`,
    300
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, url, title, description, category, tags } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'url and title are required' }, { status: 400 });
    }

    // Step 1: Get original article content (DB first, then live scrape)
    let rawContent: string | null = null;
    if (articleId) {
      try {
        const db = await getDb();
        const dbArticle = await db.article.findUnique({ where: { id: articleId } });
        rawContent = dbArticle?.content || null;
      } catch { /* ignore db errors */ }
    }
    if (!rawContent) {
      rawContent = await scrapeUrl(url);
    }
    if (!rawContent) {
      return NextResponse.json({ error: 'Could not fetch article content to regenerate from' }, { status: 422 });
    }

    // Step 2: Regenerate content with Gemini
    const regeneratedContent = await regenerateContent(title, description || '', rawContent);
    const finalContent = regeneratedContent || rawContent;

    // Step 3: Generate image — Gemini crafts the visual prompt, Pollinations renders it
    const geminiImagePrompt = await generateImagePrompt(title, description || '', finalContent);
    const imagePromptText = geminiImagePrompt
      ? geminiImagePrompt.trim()
      : `Professional editorial tech illustration, ${title}, ${(tags || []).slice(0, 3).join(', ')}, ${category || 'technology'}, clean minimalist digital art, no text`;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePromptText)}?width=1200&height=630&nologo=true&seed=${Date.now()}`;

    // Step 4: Persist to DB (non-fatal)
    try {
      const db = await getDb();
      const updateData = { content: finalContent, scrapedAt: new Date(), aiImageUrl: imageUrl };
      if (articleId) {
        await db.article.update({ where: { id: articleId }, data: updateData });
      } else {
        await db.article.updateMany({ where: { url }, data: updateData });
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      content: finalContent,
      imageUrl,
      contentRegenerated: !!regeneratedContent,
      imagePromptFromGemini: !!geminiImagePrompt,
    });
  } catch (error) {
    console.error('[regenerate-content]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
