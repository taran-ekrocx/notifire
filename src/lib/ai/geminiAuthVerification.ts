// lib/ai/geminiAuthVerification.ts

import { getGeminiApiKey } from './geminiKey';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

export interface GeminiAuthResult {
  authorized: boolean;
  authConfidence: number;
  officialSourceName: string | null;
  originalSourceUrl: string | null;
  flags: string[];
  reasoning: string;
}

const EMPTY_AUTH_RESULT: GeminiAuthResult = {
  authorized: false,
  authConfidence: 0,
  officialSourceName: null,
  originalSourceUrl: null,
  flags: ['verification-unavailable'],
  reasoning: 'Could not verify source authenticity.',
};

const OUTPUT_SCHEMA = `{
  "auth_status": "authorized" | "unauthorized",
  "auth_confidence": float between 0.0 and 1.0,
  "official_source_name": string or null,
  "original_source_url": string or null,
  "flags": [string],
  "reasoning": string
}`;

export async function verifyArticleAuthenticity(params: {
  title: string;
  content: string;
  sourceDomain: string;
  rssDomain: string;
  category: string;
}): Promise<GeminiAuthResult> {
  const { title, content, sourceDomain, rssDomain, category } = params;

  const contentExcerpt = content.slice(0, 400);

  const prompt = `You are a news authentication and source verification AI for a tech news platform.

Given a tech news article, determine whether it is published by the official/authoritative source of the subject matter (the company, organization, or project being discussed), or by a third-party publisher reporting on it.

Article details:
- Title: ${title}
- Content excerpt: ${contentExcerpt}
- Publisher domain: ${sourceDomain}
- RSS feed domain: ${rssDomain}
- Category: ${category}

Definitions:
- "authorized": The article is published directly by the primary/official source of the subject (e.g. OpenAI blog publishing about GPT-4, Kubernetes.io publishing Kubernetes release notes, AWS blog publishing AWS service announcements).
- "unauthorized": The article is published by a third-party news site, aggregator, or journalist reporting on the subject (e.g. TechCrunch writing about OpenAI's GPT-4).

For "flags", include any relevant warnings from: ["third-party-publisher", "unverified-claim", "paywalled", "clickbait-title", "speculative-content", "official-source", "cross-posted"].

Return ONLY valid JSON matching this schema:
${OUTPUT_SCHEMA}`;

  try {
    const GEMINI_API_KEY = await getGeminiApiKey();
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return EMPTY_AUTH_RESULT;
    }

    const data = await response.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return EMPTY_AUTH_RESULT;
    }

    const parsed = JSON.parse(text);

    return {
      authorized: parsed.auth_status === 'authorized',
      authConfidence: typeof parsed.auth_confidence === 'number'
        ? Math.min(1, Math.max(0, parsed.auth_confidence))
        : 0,
      officialSourceName: parsed.official_source_name || null,
      originalSourceUrl: parsed.original_source_url || null,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  } catch {
    return EMPTY_AUTH_RESULT;
  }
}
