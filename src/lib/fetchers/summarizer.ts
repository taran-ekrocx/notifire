// src/lib/fetchers/summarizer.ts

import { getGeminiApiKey } from '../ai/geminiKey';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export type ArticleSummary = {
  fullSummary: string;
  keyPoints: string[];
  readTimeMinutes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  relatedTopics: string[];
};

function truncateText(text: string, maxChars = 12000) {
  if (!text) return '';
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

async function callGemini(prompt: string): Promise<string | null> {
  try {
    const key = await getGeminiApiKey();
    const GEMINI_URL = `${GEMINI_BASE_URL}?key=${key}`;
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 1200,
        },
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

export async function summarizeArticle(
  title: string,
  description = '',
  content = '',
  source = ''
): Promise<ArticleSummary> {
  try {
    const inputText = truncateText(
      [
        title && `Title: ${title}`,
        source && `Source: ${source}`,
        description && `Description: ${description}`,
        content && `Content:\n${content}`,
      ]
        .filter(Boolean)
        .join('\n\n')
    );

    const prompt = `You are a tech news analyst.

Analyze the following article and return STRICT JSON only matching this schema:
{
  "fullSummary": "Concise paragraph summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "readTimeMinutes": 3,
  "sentiment": "positive",
  "relatedTopics": ["AI", "OpenAI"]
}

Sentiment must be exactly one of: positive, neutral, or negative.

Article:
${inputText}`;

    const raw = await callGemini(prompt);
    if (!raw) return quickSummarize(title, description, source);

    return normalizeSummary(JSON.parse(raw), title, description, source);
  } catch (error) {
    console.error('[Summarizer] Error:', error);
    return quickSummarize(title, description, source);
  }
}

export async function quickSummarize(
  title: string,
  description = '',
  source = ''
): Promise<ArticleSummary> {
  return normalizeSummary(
    {
      fullSummary:
        description ||
        `${title || 'This article'} covers recent technology news${source ? ` from ${source}` : ''}.`,
      keyPoints: [
        title || 'Technology news update',
        source ? `Published by ${source}` : 'Source not specified',
        'Open the original article for full details',
      ],
      readTimeMinutes: 3,
      sentiment: 'neutral',
      relatedTopics: ['Technology'],
    },
    title,
    description,
    source
  );
}

function normalizeSummary(
  value: Partial<ArticleSummary>,
  title: string,
  description: string,
  source: string
): ArticleSummary {
  const keyPoints =
    Array.isArray(value.keyPoints) && value.keyPoints.length
      ? value.keyPoints.map(String)
      : [
          title || 'Technology news update',
          source ? `Published by ${source}` : 'Source not specified',
          'Open the original article for full details',
        ];

  const sentiment =
    value.sentiment === 'positive' ||
    value.sentiment === 'negative' ||
    value.sentiment === 'neutral'
      ? value.sentiment
      : 'neutral';

  return {
    fullSummary:
      value.fullSummary ||
      description ||
      `${title || 'This article'} covers recent technology news.`,
    keyPoints,
    readTimeMinutes:
      typeof value.readTimeMinutes === 'number' ? value.readTimeMinutes : 3,
    sentiment,
    relatedTopics:
      Array.isArray(value.relatedTopics) && value.relatedTopics.length
        ? value.relatedTopics.map(String)
        : ['Technology'],
  };
}
