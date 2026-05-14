// lib/fetchers/scrapeArticle.ts

import * as cheerio from 'cheerio';

export async function scrapeArticle(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed with status ${response.status}`
      );
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    const title =
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled Article';

    const paragraphs = $('p')
      .map((_, el) =>
        $(el).text().trim()
      )
      .get()
      .filter(Boolean);

    const content = paragraphs
      .join('\n\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000);

    return {
      success: true,
      title,
      content,
    };
  } catch (error) {
    console.error(
      '[ScrapeArticle]',
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Scraping failed',
    };
  }
}