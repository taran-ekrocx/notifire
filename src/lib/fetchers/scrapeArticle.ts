// lib/fetchers/scrapeArticle.ts

import { chromium, Browser } from 'playwright';

let browserInstance: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.isConnected()) return browserInstance;
  if (launchPromise) return launchPromise;

  launchPromise = chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  }).then((b) => {
    browserInstance = b;
    launchPromise = null;
    b.on('disconnected', () => { browserInstance = null; });
    return b;
  }).catch((err) => {
    launchPromise = null;
    throw err;
  });

  return launchPromise;
}

export async function scrapeArticle(url: string) {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Block images, fonts, and media to speed up scraping
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const result = await page.evaluate(() => {
      // Remove video elements
      document.querySelectorAll('video, source, embed, object').forEach((el) => el.remove());
      document.querySelectorAll('iframe').forEach((el) => {
        const src = el.getAttribute('src') || '';
        if (/youtube|youtu\.be|vimeo|dailymotion|twitch/i.test(src)) el.remove();
      });

      // Strip external link anchors but keep their visible text
      document.querySelectorAll('a[href]').forEach((el) => {
        const href = el.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) {
          el.replaceWith(...Array.from(el.childNodes));
        }
      });

      const title =
        document.title?.trim() ||
        document.querySelector('h1')?.textContent?.trim() ||
        'Untitled Article';

      const parts: string[] = [];
      document.querySelectorAll('p, table').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'p') {
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (text) parts.push(text);
        } else if (tag === 'table') {
          const rows: string[][] = [];
          el.querySelectorAll('tr').forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll('th, td')).map(
              (cell) => (cell.textContent || '').replace(/\s+/g, ' ').trim()
            );
            if (cells.some((c) => c)) rows.push(cells);
          });
          if (rows.length) parts.push(rows.map((r) => r.join(' | ')).join('\n'));
        }
      });

      return { title, content: parts.join('\n\n') };
    });

    return {
      success: true,
      title: result.title,
      content: result.content.trim().slice(0, 50_000),
    };
  } catch (error) {
    console.error('[ScrapeArticle]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
    };
  } finally {
    await page?.close();
  }
}
