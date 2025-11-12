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

async function navigateSafely(page: Page, url: string) {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } catch (err) {
    console.warn(`⚠️ goto() failed, retrying with reload: ${err}`);
    try {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (reloadErr) {
      console.error(`❌ reload() failed: ${reloadErr}`);
      throw reloadErr;
    }
  }
}


async function determinePriceRanges(
  browser: Browser,
  baseUrl: string,
  maxResultsPerRange: number,
  initialRanges: [number, number][] = [
    [0, 200],
    [200, 600],
    [600, 1400],
    [1400, 3000],
    [3000, 6200],
    [6200, 10000],

  ]
): Promise<[number, number][]> {
  const finalRanges: [number, number][] = [];

  async function checkResults(minPrice: number, maxPrice: number): Promise<number> {
    const urlWithRange = `${baseUrl}&sellPrice=${minPrice}:${maxPrice}`;
    const tempPage = await browser.newPage();

    try {
      await tempPage.goto(urlWithRange, { waitUntil: "domcontentloaded", timeout: 30000 });

      // Wait for either the no-results div to be visible OR stats element to have numbers
      await tempPage.waitForFunction(() => {
        const noResultsDiv = document.querySelector('div.cx-no-results') as HTMLElement;
        if (noResultsDiv && noResultsDiv.style.display !== 'none') return true;
        
        const statsEl = document.querySelector('div.ais-Stats.stats-text p.text-base.font-normal');
        return statsEl && /\d/.test(statsEl.textContent || '');
      }, { timeout: 20000 });

      // Small delay to ensure DOM finishes rendering
      await tempPage.waitForTimeout(500);

      // Check if no-results div is visible
      const noResultsDiv = await tempPage.locator('div.cx-no-results').first();
      const isVisible = await noResultsDiv.evaluate((el: HTMLElement) => el.style.display !== 'none');
      
      if (isVisible) {
        console.log(`🔹 Price range £${minPrice} - £${maxPrice}: 0 results (no listings)`);
        return 0;
      }

      // Get total results from stats element
      const resultsElements = await tempPage.locator('div.ais-Stats.stats-text p.text-base.font-normal');
      const totalResultsText = await resultsElements.first().textContent();
      
      if (!totalResultsText) {
        console.log(`⚠️ Price range £${minPrice} - £${maxPrice}: Could not read results count`);
        return 0;
      }

      const totalResults = parseInt(totalResultsText.replace(/,/g, '').replace(/\D/g, ''));
      console.log(`🔹 Price range £${minPrice} - £${maxPrice}: ${totalResults} results`);

      return totalResults;

    } finally {
      await tempPage.close();
    }
  }

  async function splitIfNeeded(minPrice: number, maxPrice: number) {
    const totalResults = await checkResults(minPrice, maxPrice);

    if (totalResults === 0) return;

    if (totalResults <= maxResultsPerRange) {
      console.log(`✅ Accepting range £${minPrice} - £${maxPrice}`);
      finalRanges.push([minPrice, maxPrice]);
    } else {
      const midPrice = Math.floor((minPrice + maxPrice) / 2);
      if (midPrice === minPrice || midPrice === maxPrice) {
        console.log(`⚠️ Cannot split further, accepting £${minPrice} - £${maxPrice}`);
        finalRanges.push([minPrice, maxPrice]);
      } else {
        console.log(`🔁 Splitting range £${minPrice} - £${maxPrice} at £${midPrice}`);
        await splitIfNeeded(minPrice, midPrice);
        await splitIfNeeded(midPrice + 1, maxPrice);
      }
    }
  }

  for (const [minPrice, maxPrice] of initialRanges) {
    await splitIfNeeded(minPrice, maxPrice);
  }

  return finalRanges;
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

  async function worker() {
    const tab = await browser.newPage();
    // (do NOT close inside the worker)

    while (pageQueue.length > 0) {
      const pageNum = pageQueue.shift();
      if (!pageNum) break;

      const pagedUrl = `${baseUrl}&page=${pageNum}`;
      console.log(`🔍 Scraping page ${pageNum}: ${pagedUrl}`);

      let success = false;
      let attempts = 0;

      while (!success && attempts < 2) {
        attempts++;

        try {
          // 🔹 Use a helper to ensure full navigation/reload safety
          await navigateSafely(tab, pagedUrl);

          // Wait until content container exists
          await tab.waitForSelector(container, { timeout: 15000 });

          const pageResults = await scrapeCEX(tab, container, title, price, url);
          console.log(`📄 Results for page ${pageNum}: ${pageResults.length}`);

          for (const result of pageResults) {
            const key = parseVariantKey ? parseVariantKey(result.title) : result.title.trim();
            if (!variantsMap[key]) variantsMap[key] = { key, rawTitles: [] };
            variantsMap[key].rawTitles.push(result.title);
            allResults.push(result);
          }

          console.log(`✅ Page ${pageNum} done`);
          success = true;

        } catch (err) {
          console.error(`❌ Attempt ${attempts} failed for page ${pageNum}: ${err}`);
          if (attempts < 2) {
            console.log(`🔁 Retrying page ${pageNum}...`);
            await tab.waitForTimeout(3000);
          } else {
            console.log(`⚠️ Skipping page ${pageNum} after ${attempts} failed attempts`);
          }
        }
      }
    }
  }


  // 4️⃣ Start worker tabs (limited concurrency)
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const variants = Object.values(variantsMap);
  console.log(`🎉 Scraped ${variants.length} distinct variants.`);

  return { results: allResults, variants };
}

export async function scrapeAllPriceRangesCEX(
  browser: Browser,
  baseUrl: string,
  spriceRanges: [number, number][], // now passed in
  parseVariantKey?: (title: string) => string,
  concurrency: number = 3
): Promise<{ results: any[]; variants: VariantGroup[] }> {
  const allResults: any[] = [];
  const variantsMap: Record<string, VariantGroup> = {};
  const maxResultsPerRange = 59 * 17;

  console.log(`\n🔹 Determining optimal price ranges dynamically...`);
  const priceRanges = await determinePriceRanges(browser, baseUrl, maxResultsPerRange);
  console.log(`✅ Generated ${priceRanges.length} price ranges:`, priceRanges);

  for (const [minPrice, maxPrice] of priceRanges) {
    const urlWithRange = `${baseUrl}&sellPrice=${minPrice}:${maxPrice}`;
    console.log(`\n🔹 Scraping price range £${minPrice} - £${maxPrice}`);

    const { results, variants } = await scrapeAllPagesParallel(
      browser,
      urlWithRange,
      parseVariantKey,
      concurrency
    );

    for (const result of results) {
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


