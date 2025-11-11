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
export function extractLaptopAttributes(title: string) {
  // Split by '/'
  const parts = title.split('/').map(p => p.trim());

  // Part 0: Brand + Model
  const brandModelPart = parts[0] || "";
  const brandModelWords = brandModelPart.split(' ');
  const brand = brandModelWords[0];
  const model = brandModelWords.slice(1).join(' ');

  // Part 1: CPU
  const cpu = parts[1] || null;

  // Part 2: RAM
  const ramMatch = parts[2]?.match(/(\d+)\s*GB/i);
  const ram = ramMatch ? `${ramMatch[1]}GB` : null;

  // Part 3: Storage
  const storageMatch = parts[3]?.match(/(\d+(?:\.\d+)?)\s*(GB|TB)/i);
  const storage = storageMatch ? `${parseFloat(storageMatch[1])}${storageMatch[2].toUpperCase()}` : null;

  // Part 4: Screen
  const screenMatch = parts[4]?.match(/(\d{2}(\.\d+)?)["”]/);
  const screenSize = screenMatch ? `${screenMatch[1]}"` : null;

  // Part 5: OS
  const os = parts[5] || null;

  // Part 6: Condition
  const conditionMatch = parts[6]?.match(/([ABC])/i);
  const condition = conditionMatch ? conditionMatch[1].toUpperCase() : null;

  return {
    brand,
    model,
    cpu,
    ram,
    storage,
    screenSize,
    os,
    condition
  };
}

export function parseLaptopVariantKey(title: string) {
  const { brand, model, ram, storage } = extractLaptopAttributes(title);
  return [brand, model, ram, storage].filter(Boolean).join(' ');
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
      model: `${attrs.brand} ${attrs.model}`, // include brand here
      variant: parseLaptopVariantKey(item.title),
      extra: { ram: attrs.ram, storage: attrs.storage }
    };
  });

  const models: Record<string, LaptopModelGroup> = {};

    Object.values(groupedByVariant).forEach(group => {
    // Use brand + model as the key
    const modelKey = group.model; // already includes brand
    if (!models[modelKey]) {
      models[modelKey] = { model: modelKey, variants: {} };
    }

    Object.values(group.variants).forEach(v => {
      const variantKey = v.variant ?? "unknown";

      models[modelKey].variants[variantKey] = {
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
  [0, 50],
  [51, 100],
  [101, 150],
  [151, 200],
  [201, 250],
  [251, 300],
  [301, 350],
  [351, 400],
  [401, 450],
  [451, 500],
  [501, 550],
  [551, 600],
  [601, 650],
  [651, 700],
  [701, 750],
  [751, 800],
  [801, 850],
  [851, 900],
  [901, 950],
  [951, 1000],
  [1001, 1100],
  [1101, 1200],
  [1201, 1300],
  [1301, 1400],
  [1401, 1500],
  [1501, 1600],
  [1601, 1700],
  [1701, 1800],
  [1801, 1900],
  [1901, 2000],
  [2001, 2250],
  [2251, 2500],
  [2501, 2750],
  [2751, 3000],
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
