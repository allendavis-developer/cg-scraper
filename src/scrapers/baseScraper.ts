import { Page, Browser } from "playwright";
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

export interface CompetitorListing {
  title: string;
  url: string;
  price: number;
  competitor: string;
  condition: string;
  store: string;
  id: string;
}

export interface BaseVariant {
  listings: {
    competitor: string;
    id: string;
    title: string;
    price: number;
    url: string;
    condition?: string;
    store?: string;
    tradeVoucher?: number;  
    tradeCash?: number;     

  }[];
  storage?: string | null; // for mobiles
  variant?: string | null; // for games
}


interface GroupedVariant<T> {
  variant: string | null;
  extra?: Record<string, any>; // storage, edition, etc.
  listings: T[];
}

interface GroupedModel<T> {
  model: string;
  variants: Record<string, GroupedVariant<T>>;
}

export function groupResultsByVariant<T>(
  results: T[],
  parseVariantKey: (item: T) => { model: string; variant?: string; extra?: Record<string, any> }
): Record<string, GroupedModel<T>> {
  const models: Record<string, GroupedModel<T>> = {};

  for (const item of results) {
    const { model, variant, extra } = parseVariantKey(item);
    if (!model) continue;

    if (!models[model]) models[model] = { model, variants: {} };

    const variantKey = variant ?? model;
    if (!models[model].variants[variantKey]) {
      models[model].variants[variantKey] = { variant: variantKey, extra, listings: [] };
    }

    models[model].variants[variantKey].listings.push(item);
  }

  return models;
}



/* ----------------------------- Generic Scraper ----------------------------- */
export async function scrapeAllPagesParallel(
  browser: Browser,
  baseUrl: string,
  parseVariantKey?: (title: string) => string,
  concurrency: number = 3
): Promise<{ results: any[]; variants: VariantGroup[] }> {
  const resultsPerPage = 17;
  const allResults: any[] = [];
  const variantsMap: Record<string, VariantGroup> = {};
  const { container, title, price, url } = cex.selectors;


  // 1️⃣ Open a temp page to get total results
  const tempPage = await browser.newPage();
  await tempPage.goto(baseUrl, { waitUntil: "domcontentloaded" });

  // Wait for JS to render the stats element dynamically
  await tempPage.waitForFunction(() => {
    const el = document.querySelector('div.ais-Stats.stats-text p.text-base.font-normal');
    return el && /\d/.test(el.textContent || '');
  }, { timeout: 20000 });

  const resultsElements = await tempPage.locator('div.ais-Stats.stats-text p.text-base.font-normal');
  await resultsElements.first().waitFor({ state: 'attached', timeout: 15000 });

  // Small delay to ensure DOM finishes rendering
  await tempPage.waitForTimeout(500); 

  const totalResultsText = await resultsElements.first().textContent();
  if (!totalResultsText) {
    await tempPage.close();
    throw new Error("Failed to read total results text from page");
  }

  const totalResults = parseInt(totalResultsText.replace(/,/g, '').replace(/\D/g, ''));
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  console.log(`Total results: ${totalResults}, total pages: ${totalPages}`);
  await tempPage.close();

  // 2️⃣ Prepare a queue of page numbers
  const pageQueue = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 3️⃣ Worker function for each tab
  async function worker() {
    const tab = await browser.newPage();

    while (pageQueue.length > 0) {
      const pageNum = pageQueue.shift();
      if (!pageNum) break;

      const pagedUrl = `${baseUrl}&page=${pageNum}`;
      console.log(`🔍 Scraping page ${pageNum}: ${pagedUrl}`);

      await tab.goto(pagedUrl, { waitUntil: "domcontentloaded" });
      await tab.waitForSelector(container, { timeout: 10000 });

      const pageResults = await scrapeCEX(tab, container, title, price, url);
      // Log all results for this page
      console.log(`📄 Results for page ${pageNum}:`, pageResults);

      for (const result of pageResults) {
        const key = parseVariantKey ? parseVariantKey(result.title) : result.title.trim();
        if (!variantsMap[key]) variantsMap[key] = { key, rawTitles: [] };
        variantsMap[key].rawTitles.push(result.title);
        allResults.push(result);
      }

      console.log(`✅ Page ${pageNum} done`);
    }

    await tab.close();
  }

  // 4️⃣ Start worker tabs (limited concurrency)
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const variants = Object.values(variantsMap);
  console.log(`🎉 Scraped ${variants.length} distinct variants.`);

  return { results: allResults, variants };
}

export async function scrapeAllPriceRangesCEX(
  browser: Browser,
  baseUrl: string, // e.g., "https://uk.webuy.com/search?sortBy=prod_cex_uk_price_desc&categoryFriendlyName=switch+games"
  priceRanges: [number, number][], // now passed in
  parseVariantKey?: (title: string) => string,
  concurrency: number = 3
): Promise<{ results: any[]; variants: VariantGroup[] }> {
  const allResults: any[] = [];
  const variantsMap: Record<string, VariantGroup> = {};

  for (const [minPrice, maxPrice] of priceRanges) {
    const urlWithRange = `${baseUrl}&sellPrice=${minPrice}:${maxPrice}`;
    console.log(`\n🔹 Scraping price range £${minPrice} - £${maxPrice}`);

    const { results, variants } = await scrapeAllPagesParallel(
      browser,
      urlWithRange,
      parseVariantKey,
      concurrency
    );

    // Merge and deduplicate results
    for (const result of results) {
      // Normalize key for grouping (case-insensitive), but preserve original case in data
      const rawKey = parseVariantKey ? parseVariantKey(result.title) : result.title.trim();
      const normalizedKey = rawKey.toLowerCase();

      if (!variantsMap[normalizedKey]) {
        variantsMap[normalizedKey] = { key: rawKey, rawTitles: [] };
      }
      variantsMap[normalizedKey].rawTitles.push(result.title);
      allResults.push(result);

    }
  }

  const variants = Object.values(variantsMap);
  console.log(`\n🎉 Total scraped ${variants.length} distinct variants across all price ranges.`);

  return { results: allResults, variants };
}
