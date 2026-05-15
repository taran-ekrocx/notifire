// src/app/api/regenerate-content/route.ts
// Regenerate article content and image using Gemini AI

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';
import { getDb } from '@/lib/db';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBLi67n5C6wxFDDVc_Q-jfaelZr3kMEW6s';
const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_IMAGE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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

async function regenerateContentWithGemini(
  title: string,
  description: string,
  rawContent: string
): Promise<string | null> {
  try {
    const prompt = `You are a senior tech journalist writing for a professional audience. Based on the original scraped article below, create a unique, optimized rewrite that:
- Opens with a compelling hook sentence
- Clearly explains the core news/development
- Preserves all verified facts, data points, and direct quotes from the original
- Adds context to help readers understand significance
- Closes with a forward-looking insight

Write in flowing paragraphs only — no markdown, no headers, no bullet points. Keep it between 300-500 words. Output plain text only.

Title: ${title}
Description: ${description}
Original Content:
${rawContent.slice(0, 12000)}`;

    const response = await fetch(`${GEMINI_TEXT_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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

async function generateImageWithGemini(
  title: string,
  description: string,
  content: string
): Promise<string | null> {
  try {
    const prompt = `Generate a professional editorial illustration for this tech news article.

Article: ${title}
Summary: ${description}
Key themes: ${content.slice(0, 400)}

Style requirements: Clean, modern digital illustration. No text or typography. Professional editorial look suitable for a tech publication. Abstract or conceptual visual metaphor for the topic. High contrast, vibrant colours.`;

    const response = await fetch(`${GEMINI_IMAGE_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> =
      data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart?.inlineData?.data) return null;

    const hash = createHash('md5').update(title + Date.now()).digest('hex');
    const ext = imagePart.inlineData.mimeType.split('/')[1]?.split(';')[0] || 'png';
    const filename = `${hash}.${ext}`;
    const dir = join(process.cwd(), 'public', 'generated');

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), Buffer.from(imagePart.inlineData.data, 'base64'));

    return `/generated/${filename}`;
  } catch {
    return null;
  }
}

function buildPollinationsUrl(title: string, category: string, tags: string[]): string {
  // Use Gemini-style descriptive prompt for Pollinations fallback
  const prompt = `Professional editorial tech illustration, ${title}, ${(tags || []).slice(0, 3).join(', ')}, ${category || 'technology'}, clean minimalist digital art, no text`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&nologo=true&seed=${Date.now()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, url, title, description, category, tags } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'url and title are required' }, { status: 400 });
    }

    // Step 1: Get original article content (DB first, then scrape)
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
      return NextResponse.json({ error: 'Could not fetch article content to regenerate from' }, { status: 422 });
    }

    // Step 2: Regenerate content with Gemini (unique + optimized)
    const regeneratedContent = await regenerateContentWithGemini(title, description || '', rawContent);
    const finalContent = regeneratedContent || rawContent;

    // Step 3: Generate image with Gemini AI (fallback to Pollinations)
    const geminiImageUrl = await generateImageWithGemini(title, description || '', finalContent);
    const imageUrl = geminiImageUrl ?? buildPollinationsUrl(title, category || 'technology', tags || []);

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
      // Non-fatal — still return the regenerated data
    }

    return NextResponse.json({
      success: true,
      content: finalContent,
      imageUrl,
      imageSource: geminiImageUrl ? 'gemini' : 'pollinations',
    });
  } catch (error) {
    console.error('[regenerate-content]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
