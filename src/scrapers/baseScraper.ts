import { Page } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";

/* ----------------------------- Type Definitions ----------------------------- */

export interface ScraperOptions {
  competitor: string;
  item: string;
  category: string;
  attributes?: Record<string, string>;
  subcategory?: string;
  broad?: boolean;
}

export interface VariantGroup {
  key: string;        // grouping key (could be model, title, etc.)
  rawTitles: string[];
}

export interface ScrapeResult {
  competitor: string;
  results: any[];
  variants?: VariantGroup[];
}

/* ----------------------------- Generic Scraper ----------------------------- */

export async function scrapeAllPages(
  page: Page,
  baseUrl: string,
  parseVariantKey?: (title: string) => string
): Promise<{ results: any[]; variants: VariantGroup[] }> {
  const resultsPerPage = 17;
  const allResults: any[] = [];
  const variantsMap: Record<string, VariantGroup> = {};
  const { container, title, price, url } = cex.selectors;

  let pageNum = 1;

  while (true) {
    const pagedUrl = `${baseUrl}&page=${pageNum}`;
    console.log(`🔍 Scraping page ${pageNum}: ${pagedUrl}`);

    await page.goto(pagedUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const pageResults = await scrapeCEX(page, container, title, price, url);
    console.log(`✅ Page ${pageNum}: ${pageResults.length} items`);

    for (const result of pageResults) {
      const key = parseVariantKey
        ? parseVariantKey(result.title)
        : result.title.trim();

      if (!variantsMap[key]) {
        variantsMap[key] = { key, rawTitles: [] };
      }

      variantsMap[key].rawTitles.push(result.title);
      allResults.push(result);
    }

    // Stop if fewer than 17 results (last page)
    if (pageResults.length < resultsPerPage) {
      console.log(`🚧 Last page reached (only ${pageResults.length} results).`);
      break;
    }

    pageNum++;
  }

  const variants = Object.values(variantsMap);
  console.log(`🎉 Scraped ${variants.length} distinct variants.`);

  return { results: allResults, variants };
}
