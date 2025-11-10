import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { ScrapeResult, CompetitorListing, groupResultsByVariant, scrapeAllPriceRangesCEX } from "./baseScraper";

export interface LaptopAttributes {
  brand: string;
  model: string;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  screenSize?: string | null;
  os?: string | null;
  condition?: "B" | "A" | "C" | null;
}

/**
 * Extract structured laptop attributes from title
 * Example titles:
 * - "HP 14S-DQ0034/N4120/4GB Ram/128GB SSD/14\"/W11/B"
 * - "Lenovo ThinkPad X1 Gen 10/i7-1260P/16GB Ram/512GB SSD/14\"/W11/B"
 * - "MacBook Air 14,2/M2 (8-CPU 8-GPU)/8GB Ram/256GB SSD/13\"/Midnight/B"
 */
export function extractLaptopAttributes(title: string): LaptopAttributes {
  const lower = title.toLowerCase();

  // Brand
  const brandMatch = title.match(/^(hp|lenovo|dell|asus|msi|macbook|apple|acer|samsung|toshiba|razer|fujitsu)/i);
  let brand = brandMatch ? brandMatch[1] : "Unknown";
  if (/macbook|apple/i.test(brand)) brand = "Apple";

  // Model — capture chunk after brand up to first slash
  const modelMatch = title.match(/(?:macbook|apple)\s*([^\/*]+)/i);
  let model = modelMatch ? modelMatch[1].trim() : "Unknown";

  // ✅ Ensure “MacBook” prefix if Apple
  if (brand === "Apple" && !/^macbook/i.test(model)) {
    model = `MacBook ${model}`;
  }

  // CPU
  const cpuMatch = title.match(/(i[3579]-\d{3,5}h?|ryzen\s?\d\s?\d{3,4}h?|m\d\s?\([^)]+\)|m\d\b)/i);
  const cpu = cpuMatch ? cpuMatch[1].toUpperCase() : null;

  // RAM
  const ramMatch = title.match(/(\d+)\s?gb(?:\s?ram)?/i);
  const ram = ramMatch ? `${ramMatch[1]}GB` : null;

  // Storage (only the numeric + unit, ignore SSD/HDD)
  const storageMatches = [...title.matchAll(/(\d+(?:\.\d+)?)(TB|GB)/gi)];
  const storage = storageMatches.length > 0
    ? `${parseFloat(storageMatches[storageMatches.length - 1][1])}${storageMatches[storageMatches.length - 1][2].toUpperCase()}`
    : null;

  // Screen
  const screenMatch = title.match(/(\d{2}(\.\d+)?)["”]/);
  const screenSize = screenMatch ? `${screenMatch[1]}"` : null;

  // OS
  const osMatch = title.match(/\b(W11|W10|Windows 11|Windows 10|Linux|MacOS|OSX|ChromeOS)\b/i);
  const os = osMatch ? osMatch[1].replace(/^W11$/, "Windows 11").replace(/^W10$/, "Windows 10") : null;

  // Condition
  const conditionMatch = title.match(/\/([ABC])$/i);
  const condition = conditionMatch ? conditionMatch[1].toUpperCase() as LaptopAttributes["condition"] : null;

  return { brand, model, cpu, ram, storage, screenSize, os, condition };
}


export function parseLaptopVariantKey(title: string): string {
  const { model, ram, storage } = extractLaptopAttributes(title);
  return [model, ram, storage].filter(Boolean).join(" ");
}


export interface LaptopSearchOptions {
  competitor: "CEX";
  item: string;                               // Search keyword (e.g., "MacBook Pro", "HP Pavilion")
  category: "laptops";
  attributes?: {
    ram?: string;                             // Optional filter (e.g., "16GB")
    storage?: string;                         // Optional filter (e.g., "512GB SSD")
    cpu?: string;                             // Optional filter (e.g., "i7" or "Ryzen 7")
    os?: string;                              // Optional filter (e.g., "Windows 11", "MacOS")
    screenSize?: string;                      // Optional filter (e.g., '14"' or '15.6"')
  };
  broad?: boolean;                            // Whether to run a broad (multi-price-range) scrape
  subcategory?: string;                       // Optional subcategory if CEX supports it
  priceRanges?: [number, number][];           // Optional price ranges for broad scraping
}


/* ----------------------------- Type Definitions ----------------------------- */

export interface LaptopVariantGroup {
  variant: string;
  ram?: string | null;
  storage?: string | null;
  listings: CompetitorListing[];
}

export interface LaptopModelGroup {
  model: string;
  variants: Record<string, LaptopVariantGroup>;
}

export interface LaptopScrapeResult {
  competitor: string;
  models: Record<string, LaptopModelGroup>;
}



export function transformScrapeResultToLaptopScrapeResult(
  scrapeResult: ScrapeResult
): LaptopScrapeResult {
  const { competitor, results } = scrapeResult;

  const groupedByVariant = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const attrs = extractLaptopAttributes(item.title);
    return {
      model: attrs.model,
      variant: parseLaptopVariantKey(item.title),
      extra: { ram: attrs.ram, storage: attrs.storage }
    };
  });

  const models: Record<string, LaptopModelGroup> = {};

  Object.values(groupedByVariant).forEach(group => {
    // Ensure model exists
    if (!models[group.model]) {
      models[group.model] = { model: group.model, variants: {} };
    }

    Object.values(group.variants).forEach(v => {
      const variantKey = v.variant ?? "unknown";

      models[group.model].variants[variantKey] = {
        variant: variantKey,
        ram: v.extra?.ram ?? null,
        storage: v.extra?.storage ?? null,
        listings: v.listings,
      };
    });
  });

  return { competitor, models };
}



const defaultLaptopPriceRanges: [number, number][] = [
  [0, 200],
  [201, 400],
  [401, 800],
  [801, 1500],
  [1501, 3000],
];


export async function getLaptopResults(
  browser: Browser,
  options: LaptopSearchOptions
) {
  const {
    competitor,
    item,
    attributes,
    broad,
    subcategory,
    priceRanges = defaultLaptopPriceRanges,
  } = options;

  if (competitor !== "CEX") throw new Error(`Unsupported competitor: ${competitor}`);

  const searchParams: any = {
    item,
    category: "laptops",
  };

  if (subcategory) searchParams.subcategory = subcategory;

  const baseUrl = cex.searchUrl(searchParams);
  console.log(`Navigating to: ${baseUrl}`);

  let scrapeResult: ScrapeResult;

  if (!broad) {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    const results = await scrapeCEX(page, container, title, price, url);
    await page.close();
    scrapeResult = { competitor, results };
  } else {
    const { results } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges || [[0, 200], [201, 400], [401, 800], [801, 1500], [1501, 3000]],
      parseLaptopVariantKey,
      3
    );
    scrapeResult = { competitor, results };
  }

  return transformScrapeResultToLaptopScrapeResult(scrapeResult);
}
