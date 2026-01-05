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
  
  // Create a single page to reuse for all checks
  const page = await browser.newPage();

  async function checkResults(minPrice: number, maxPrice: number): Promise<number> {
    const urlWithRange = `${baseUrl}&sellPrice=${minPrice}:${maxPrice}`;

    // 🔹 Add retry logic here
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        await page.goto(urlWithRange, { waitUntil: "domcontentloaded", timeout: 30000 });

        // Wait for either the no-results div to be visible OR stats element to have numbers
        await page.waitForFunction(() => {
          const noResultsDiv = document.querySelector('div.cx-no-results') as HTMLElement;
          if (noResultsDiv && noResultsDiv.style.display !== 'none') return true;
          
          const statsEl = document.querySelector('div.ais-Stats.stats-text p.text-base.font-normal');
          return statsEl && /\d/.test(statsEl.textContent || '');
        }, { timeout: 20000 });

        // Small delay to ensure DOM finishes rendering
        await page.waitForTimeout(500);

        // Check if no-results div is visible
        const noResultsDiv = await page.locator('div.cx-no-results').first();
        const isVisible = await noResultsDiv.evaluate((el: HTMLElement) => el.style.display !== 'none');
        
        if (isVisible) {
          console.log(`🔹 Price range £${minPrice} - £${maxPrice}: 0 results (no listings)`);
          return 0;
        }

        // Get total results from stats element
        const resultsElements = await page.locator('div.ais-Stats.stats-text p.text-base.font-normal');
        const totalResultsText = await resultsElements.first().textContent();
        
        if (!totalResultsText) {
          console.log(`⚠️ Price range £${minPrice} - £${maxPrice}: Could not read results count`);
          return 0;
        }

        const totalResults = parseInt(totalResultsText.replace(/,/g, '').replace(/\D/g, ''));
        console.log(`🔹 Price range £${minPrice} - £${maxPrice}: ${totalResults} results`);

        return totalResults;

      } catch (error) {
        console.error(`❌ Attempt ${attempts}/${maxAttempts} failed for range £${minPrice} - £${maxPrice}:`, error);
        
        if (attempts < maxAttempts) {
          console.log(`🔁 Retrying in 3 seconds...`);
          await page.waitForTimeout(3000);
        } else {
          console.error(`⚠️ All retries exhausted for range £${minPrice} - £${maxPrice}, returning 0`);
          return 0; // 🔹 Return 0 instead of throwing
        }
      }
    }

    return 0; // Fallback (shouldn't reach here)
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

  // Close the page when done
  await page.close();

  return finalRanges;
}


/* ----------------------------- Generic Scraper ----------------------------- */
export async function scrapeAllPagesParallel(
  browser: Browser,
  baseUrl: string,
  parseVariantKey?: (title: string) => string,
  concurrency: number = 1
): Promise<{ results: any[]; variants: VariantGroup[] }> {
  const resultsPerPage = 17;
  const allResults: any[] = [];
  const variantsMap: Record<string, VariantGroup> = {};
  const { container, title, price, url } = cex.selectors;

  // 1️⃣ Open a temp page to get total results with retry logic
  const tempPage = await browser.newPage();
  
  let totalResults = 0;
  let totalPages = 0;
  let setupAttempts = 0;
  const maxSetupAttempts = 3;
  
  while (setupAttempts < maxSetupAttempts) {
    setupAttempts++;
    
    try {
      await tempPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

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
        throw new Error("Failed to read total results text from page");
      }

      totalResults = parseInt(totalResultsText.replace(/,/g, '').replace(/\D/g, ''));
      totalPages = Math.ceil(totalResults / resultsPerPage);

      console.log(`Total results: ${totalResults}, total pages: ${totalPages}`);
      break; // Success, exit retry loop
      
    } catch (error) {
      console.error(`❌ Setup attempt ${setupAttempts}/${maxSetupAttempts} failed:`, error);
      
      if (setupAttempts < maxSetupAttempts) {
        console.log(`🔁 Retrying setup in 3 seconds...`);
        await tempPage.waitForTimeout(3000);
      } else {
        console.error(`⚠️ All setup attempts exhausted, closing page and returning empty results`);
        await tempPage.close();
        return { results: [], variants: [] };
      }
    }
  }

  // 🔹 DON'T close - reuse it!
  // await tempPage.close(); ❌ REMOVE THIS LINE

  // 2️⃣ Reuse tempPage for scraping
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    console.log(`🔍 Scraping page ${pageNum}`);

    let success = false;
    let attempts = 0;

    while (!success && attempts < 2) {
      attempts++;

      try {
        // 🔹 Page 1 is already loaded, skip navigation
        if (pageNum > 1) {
          const pagedUrl = `${baseUrl}&page=${pageNum}`;
          await navigateSafely(tempPage, pagedUrl);
          await tempPage.waitForTimeout(1000 + Math.random() * 2000);
        }

        // Wait until content container exists
        await tempPage.waitForSelector(container, { timeout: 15000 });

        const pageResults = await scrapeCEX(tempPage, container, title, price, url);
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
          await tempPage.waitForTimeout(3000);
        } else {
          console.log(`⚠️ Skipping page ${pageNum} after ${attempts} failed attempts`);
        }
      }
    }
  }

  // 🔹 Close at the end
  await tempPage.close();

  const variants = Object.values(variantsMap);
  console.log(`🎉 Scraped ${variants.length} distinct variants.`);

  return { results: allResults, variants };
}

export async function scrapeAllPriceRangesCEX(
  browser: Browser,
  baseUrl: string,
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


