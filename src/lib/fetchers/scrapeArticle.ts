// lib/fetchers/scrapeArticle.ts

import * as cheerio from 'cheerio';
import type { CheerioAPI, AnyNode } from 'cheerio';

function extractTable($: CheerioAPI, tableEl: AnyNode): string {
  const rows: string[][] = [];
  $(tableEl).find('tr').each((_, tr) => {
    const cells = $(tr)
      .find('th, td')
      .map((_, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
      .get();
    if (cells.some((c) => c)) rows.push(cells);
  });
  if (!rows.length) return '';
  return rows.map((row) => row.join(' | ')).join('\n');
}

export async function scrapeArticle(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled Article';

    // Remove video elements entirely
    $('video, source, embed, object').remove();
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (/youtube|youtu\.be|vimeo|dailymotion|twitch/i.test(src)) {
        $(el).remove();
      }
    });

    // Strip external link anchors but keep their visible text
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (/^https?:\/\//i.test(href)) {
        $(el).replaceWith($(el).html() || '');
      }
    });

    // Extract paragraphs and tables in document order
    const parts: string[] = [];

    $('p, table').each((_, el) => {
      const tag = (el as { tagName?: string }).tagName?.toLowerCase();
      if (tag === 'p') {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text) parts.push(text);
      } else if (tag === 'table') {
        const tableText = extractTable($, el);
        if (tableText) parts.push(tableText);
      }
    });

    const content = parts.join('\n\n').trim().slice(0, 50000);

    return { success: true, title, content };
  } catch (error) {
    console.error('[ScrapeArticle]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
    };
  }
}
