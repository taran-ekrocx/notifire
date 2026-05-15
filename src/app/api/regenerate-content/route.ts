// src/app/api/regenerate-content/route.ts
// Regenerate article content and image using Gemini AI

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getDb } from '@/lib/db';
import { getGeminiApiKey } from '@/lib/ai/geminiKey';
import { scrapeArticle } from '@/lib/fetchers/scrapeArticle';

async function buildGeminiUrl(model: string): Promise<string> {
  const key = await getGeminiApiKey();
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${key}`;
}

async function callGeminiText(prompt: string, maxTokens = 2048): Promise<string | null> {
  try {
    const url = await buildGeminiUrl('gemini-2.5-flash:generateContent');
    const res = await fetch(url, {
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

async function callGeminiImage(prompt: string): Promise<Buffer | null> {
  try {
    const key = await getGeminiApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function saveImageToDisk(buf: Buffer, articleId: string): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'generated');
  await mkdir(dir, { recursive: true });
  const filename = `regen-${articleId}-${Date.now()}.png`;
  await writeFile(path.join(dir, filename), buf);
  return `/generated/${filename}`;
}

// GET — return existing regeneration data for an article
export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get('articleId');
  if (!articleId) {
    return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
  }
  try {
    const db = await getDb();
    const regen = await db.articleRegeneration.findUnique({ where: { articleId } });
    if (!regen) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, content: regen.content, imageUrl: regen.imageUrl });
  } catch {
    return NextResponse.json({ found: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, url, title, description, category, tags } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'url and title are required' }, { status: 400 });
    }

    // Step 1: get original content (DB first, then live scrape)
    let rawContent: string | null = null;
    const db = await getDb();
    if (articleId) {
      try {
        const dbArticle = await db.article.findUnique({ where: { id: articleId } });
        rawContent = dbArticle?.content || null;
      } catch { /* ignore */ }
    }
    if (!rawContent) {
      const scraped = await scrapeArticle(url);
      rawContent = scraped.success ? scraped.content || null : null;
    }
    if (!rawContent) {
      return NextResponse.json({ error: 'Could not fetch article content to regenerate from' }, { status: 422 });
    }

    // Step 2: regenerate content with Gemini
    const regeneratedContent = await callGeminiText(
      `You are a senior tech journalist. Based on the original article content below, produce a unique, optimized rewrite that:
- Opens with a compelling hook that captures the core news immediately
- Covers all key facts, data points, and quotes from the original
- Adds context to explain why this matters to tech readers
- Closes with a forward-looking insight or implication

Write in clear flowing paragraphs only — no markdown, no headers, no bullet points. 300–500 words. Plain text output only.

Title: ${title}
Description: ${description || ''}
Original Content:
${rawContent.slice(0, 12000)}`,
      2048
    );
    const finalContent = regeneratedContent || rawContent;

    // Step 3: generate image via Gemini (safe editorial illustration, no people/text/logos)
    const imagePromptText = `Create a professional, safe editorial illustration for a tech news article.
Style: clean minimalist digital art, flat design, abstract geometric shapes, technology theme.
No people, no faces, no text, no logos, no brand marks, no copyrighted characters.
Color palette: modern blues, purples, and teals on a light or dark background.
Topic context: ${title} — ${(description || '').slice(0, 200)}
Category: ${category || 'technology'}`;

    let imageUrl: string | null = null;
    const imageBuf = await callGeminiImage(imagePromptText);
    if (imageBuf && articleId) {
      try {
        imageUrl = await saveImageToDisk(imageBuf, articleId);
      } catch { /* non-fatal */ }
    }

    // Fallback: Pollinations with safety tags if Gemini image generation failed
    if (!imageUrl) {
      const fallbackPrompt = `professional editorial tech illustration, ${title}, ${(tags || []).slice(0, 3).join(', ')}, ${category || 'technology'}, clean minimalist digital art, no text, no people, abstract geometric`;
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=550&height=366&nologo=true&seed=${Date.now()}`;
    }

    // Step 4: persist to ArticleRegeneration table (separate from Article)
    if (articleId) {
      try {
        await db.articleRegeneration.upsert({
          where: { articleId },
          create: { articleId, content: finalContent, imageUrl },
          update: { content: finalContent, imageUrl },
        });
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({
      success: true,
      content: finalContent,
      imageUrl,
      contentRegenerated: !!regeneratedContent,
      imageFromGemini: !!imageBuf,
    });
  } catch (error) {
    console.error('[regenerate-content]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
