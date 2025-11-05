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

export interface MobileVariant {
  model: string;
  storages: string[];
  rawTitles: string[];
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

function parseMobileVariantKey(title: string): string {
  const { model, storage } = extractMobileModelAndStorage(title);
  return storage ? `${model} ${storage}` : model;
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
): Promise<ScrapeResult> {
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

  // Single page scrape
  if (!broad) {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    const results = await scrapeCEX(page, container, title, price, url);
    await page.close();
    return { competitor, results };
  }

  // Multi-page scrape (parallel) using price ranges
  const { results, variants } = await scrapeAllPriceRangesCEX(
    browser,
    baseUrl,
    defaultMobilePriceRanges, // this is the new parameter we'll handle
    parseMobileVariantKey,
    3, // concurrency
  );

  return { competitor, results, variants };
}
