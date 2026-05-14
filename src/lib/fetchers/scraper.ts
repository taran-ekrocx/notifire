import axios from "axios";
import * as cheerio from "cheerio";

export type ScrapedArticle = {
  success: boolean;
  title: string;
  content: string;
  estimatedReadTime: number;
  error?: string;
};

export async function scrapeArticle(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text() ||
      $("h1").first().text() ||
      "Untitled Article";

    const content = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 15000);

    return {
      success: Boolean(content),
      title: title.trim(),
      content,
      estimatedReadTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 220)),
    };
  } catch (error) {
    return {
      success: false,
      title: "Untitled Article",
      content: "",
      estimatedReadTime: 3,
      error: error instanceof Error ? error.message : "Scraping failed",
    };
  }
}

export function extractMainContent(scraped: ScrapedArticle) {
  return {
    title: scraped.title,
    content: scraped.content,
    estimatedReadTime: scraped.estimatedReadTime,
  };
}
