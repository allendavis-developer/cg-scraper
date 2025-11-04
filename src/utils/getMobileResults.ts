import { Page } from "playwright";
import { cex, cexMobileBroadSearchUrl } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";

/* ----------------------------- Type Definitions ----------------------------- */

interface MobileSearchOptions {
  competitor: "CEX";
  item: string;
  category: "smartphones and mobile";
  attributes?: { storage?: string };
  broad?: boolean;
  subcategory?: string;
}

interface MobileVariant {
  model: string;
  storages: string[];
  rawTitles: string[];
}

interface MobileScrapeResult {
  competitor: string;
  results: any[];
  models?: MobileVariant[];
}

/* --------------------------- Helper Functions --------------------------- */

// 🧠 Extract model name and storage (e.g. “iPhone 15 Pro Max 256GB” → model + 256GB)
function extractMobileModelAndStorage(title: string) {
  const lower = title.toLowerCase();
  const match = lower.match(/(.+?)\s+(\d{1,4}gb)/i);

  if (match) {
    return { model: match[1].trim(), storage: match[2].toUpperCase() };
  }

  // Fallback if storage not found
  return { model: title.trim(), storage: null };
}

// 📊 Parse the total number of results from the “xx results” text
async function getTotalResultsCount(page: Page): Promise<number> {
  const statsSelector = ".ais-Stats.stats-text p";
  await page.waitForSelector(`${statsSelector}:visible`, { timeout: 15000 });

  const statElements = await page.$$(statsSelector);
  for (const el of statElements) {
    if (await el.isVisible()) {
      const text = (await el.textContent()) || "";
      const match = text.match(/([\d,]+)\s+results/i);
      if (match) return parseInt(match[1].replace(/,/g, ""), 10);
    }
  }

  console.warn("⚠️ Could not detect total results count — defaulting to 1 page.");
  return 0;
}

/* --------------------------- Scraping Logic --------------------------- */

// 🧩 Handles multi-page scraping for mobiles
async function scrapeAllMobilePages(
  page: Page,
  baseUrl: string
): Promise<{ results: any[]; models: MobileVariant[] }> {
  const totalResults = await getTotalResultsCount(page);
  const resultsPerPage = 17;
  const totalPages = Math.ceil(totalResults / resultsPerPage) || 1;

  console.log(`📱 Found ${totalResults} results (${totalPages} pages)`);

  const allResults: any[] = [];
  const modelsMap: Record<string, MobileVariant> = {};

  const { container, title, price, url: urlSel } = cex.selectors;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pagedUrl = `${baseUrl}&page=${pageNum}`;
    console.log(`🔍 Scraping page ${pageNum}/${totalPages}: ${pagedUrl}`);

    await page.goto(pagedUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const pageResults = await scrapeCEX(page, container, title, price, urlSel);
    console.log(`✅ Page ${pageNum}: ${pageResults.length} items`);

    for (const result of pageResults) {
      const { model, storage } = extractMobileModelAndStorage(result.title);

      if (!modelsMap[model]) {
        modelsMap[model] = { model, storages: [], rawTitles: [] };
      }

      if (storage && !modelsMap[model].storages.includes(storage)) {
        modelsMap[model].storages.push(storage);
      }

      modelsMap[model].rawTitles.push(result.title);
      allResults.push(result);
    }
  }

  const models = Object.values(modelsMap);
  console.log(`🎉 Scraped ${models.length} distinct mobile models.`);

  return { results: allResults, models };
}

/* --------------------------- Entry Function --------------------------- */

export async function getMobileResults(
  page: Page,
  options: MobileSearchOptions
): Promise<MobileScrapeResult> {
  const { competitor, item, attributes, broad, subcategory } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const baseUrl = broad
    ? cexMobileBroadSearchUrl(item, subcategory || item)
    : cex.searchUrl({
        item,
        category: "smartphones and mobile",
        attributes,
      });

  console.log(`🌐 Navigating to: ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  if (!broad) {
    const { container, title, price, url } = cex.selectors;
    const results = await scrapeCEX(page, container, title, price, url);
    return { competitor, results };
  }

  const { results, models } = await scrapeAllMobilePages(page, baseUrl);
  return { competitor, results, models };
}
