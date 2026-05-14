// src/lib/fetchers/summarizer.ts

import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
});

export type ArticleSummary = {
  fullSummary: string;
  keyPoints: string[];
  readTimeMinutes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  relatedTopics: string[];
};

function truncateText(text: string, maxChars = 12000) {
  if (!text) return '';
  return text.length > maxChars
    ? text.slice(0, maxChars)
    : text;
}

export async function summarizeArticle(
  title: string,
  description = '',
  content = '',
  source = ''
): Promise<ArticleSummary> {
  try {
    const cleanText = truncateText(
      [
        title && `Title: ${title}`,
        source && `Source: ${source}`,
        description && `Description: ${description}`,
        content && `Content:\n${content}`,
      ]
        .filter(Boolean)
        .join('\n\n')
    );

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4.1-mini',

      max_tokens: 1200,

      temperature: 0.4,

      messages: [
        {
          role: 'system',
          content: `
You are a tech news analyst.

Return STRICT JSON only:
{
  "fullSummary": "Concise paragraph summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "readTimeMinutes": 3,
  "sentiment": "positive",
  "relatedTopics": ["AI", "OpenAI"]
}

Sentiment must be positive, neutral, or negative.
`,
        },
        {
          role: 'user',
          content: cleanText,
        },
      ],
    });

    return normalizeSummary(
      JSON.parse(response.choices?.[0]?.message?.content || '{}'),
      title,
      description,
      source
    );
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
      typeof value.readTimeMinutes === 'number'
        ? value.readTimeMinutes
        : 3,
    sentiment,
    relatedTopics:
      Array.isArray(value.relatedTopics) && value.relatedTopics.length
        ? value.relatedTopics.map(String)
        : ['Technology'],
  };
}
