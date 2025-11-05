import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { scrapeAllPriceRangesCEX, ScrapeResult, VariantGroup } from "./baseScraper";

/* ----------------------------- Type Definitions ----------------------------- */

export interface MobileSearchOptions {
  competitor: "CEX";
  item: string;
  category: "smartphones and mobile";
  attributes?: { storage?: string };
  broad?: boolean;
  subcategory?: string;
  priceRanges?: [number, number][]; // optional, allows custom ranges
}


export interface MobileListing {
  title: string;
  url: string;
  price: number;
  competitor: string;
}

export interface MobileStorageGroup {
  storage: string | null;
  listings: MobileListing[];
}

export interface MobileModelGroup {
  model: string;
  variants: Record<string, MobileStorageGroup>; // key = model + storage
}

export interface MobileScrapeResult {
  competitor: string;
  models: Record<string, MobileModelGroup>; // key = model name
}


/* --------------------------- Helper: Mobile Variant --------------------------- */

// 🧠 Extract model and storage, supporting GB + TB (e.g. “iPhone 15 Pro Max 1TB”)
function extractMobileModelAndStorage(title: string) {
  const lower = title.toLowerCase();

  // Match things like “iPhone 15 Pro Max 256GB” or “Galaxy S24 Ultra 1TB”
  const match = lower.match(/(.+?)\s+(\d+(?:\.\d+)?)(tb|gb)\b/i);

  if (match) {
    const model = match[1].trim();
    const storage = `${parseFloat(match[2])}${match[3].toUpperCase()}`;
    return { model, storage };
  }

  // Fallback if storage not found
  return { model: title.trim(), storage: null };
}

export function parseMobileVariantKey(title: string): string {
  const { model, storage } = extractMobileModelAndStorage(title);
  return storage ? `${model} ${storage}` : model;
}


/* --------------------------- Types --------------------------- */

export interface MobileListing {
  title: string;
  url: string;
  price: number;
  competitor: string;
  [key: string]: any; // other optional fields
}

export interface MobileStorageGroup {
  storage: string | null;
  listings: MobileListing[];
}

export interface MobileModelGroup {
  model: string;
  variants: Record<string, MobileStorageGroup>; // key = model + storage
}

export interface MobileScrapeResult {
  competitor: string;
  models: Record<string, MobileModelGroup>; // key = model name
}

/* --------------------------- Transform Function --------------------------- */

export function transformScrapeResultToMobileScrapeResult(
  scrapeResult: ScrapeResult
): MobileScrapeResult {
  const models: Record<string, MobileModelGroup> = {};

  const parseVariantKey = (title: string) => {
    // Reuse your existing function
    const { model, storage } = extractMobileModelAndStorage(title);
    return { model, storage };
  };

  for (const item of scrapeResult.results) {
    const { model, storage } = parseVariantKey(item.title);

    // Initialize model if not exists
    if (!models[model]) {
      models[model] = { model, variants: {} };
    }

    const variantKey = storage ? `${model} ${storage}` : model;

    // Initialize storage variant if not exists
    if (!models[model].variants[variantKey]) {
      models[model].variants[variantKey] = {
        storage,
        listings: [],
      };
    }

    // Add the actual listing
    models[model].variants[variantKey].listings.push({
      ...item,
      competitor: scrapeResult.competitor,
    });
  }

  return {
    competitor: scrapeResult.competitor,
    models,
  };
}


/* --------------------------- Default Price Ranges --------------------------- */

const defaultMobilePriceRanges: [number, number][] = [
  [0, 100],
  [101, 200],
  [201, 400],
  [401, 600],
  [601, 1000],
  [1001, 2000],
];

/* --------------------------- Main Entry --------------------------- */

export async function getMobileResults(
  browser: Browser,
  options: MobileSearchOptions
): Promise<MobileScrapeResult> {
  const { competitor, item, attributes, broad, subcategory, priceRanges } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const searchParams: any = {
    item,
    category: "smartphones and mobile",
    attributes,
  };

  if (subcategory) searchParams.subcategory = subcategory;

  const baseUrl = cex.searchUrl(searchParams);
  console.log(`Navigating to: ${baseUrl}`);

  let scrapeResult: ScrapeResult;

  if (!broad) {
    // Single page scrape
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    const results = await scrapeCEX(page, container, title, price, url);
    await page.close();
    scrapeResult = { competitor, results };
  } else {
    // Multi-page scrape (parallel) using price ranges
    const { results, variants } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges || defaultMobilePriceRanges,
      parseMobileVariantKey,
      3
    );

    scrapeResult = { competitor, results, variants };
  }

  // Transform into MobileScrapeResult
  return transformScrapeResultToMobileScrapeResult(scrapeResult);
}
