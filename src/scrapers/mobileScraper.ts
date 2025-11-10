import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { scrapeAllPriceRangesCEX, ScrapeResult, CompetitorListing, VariantGroup, groupResultsByVariant  } from "./baseScraper";

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



export interface MobileVariantGroup {
  variant: string;               // ✅ added
  storage: string | null;
  listings: CompetitorListing[];
}


export interface MobileModelGroup {
  model: string;
  variants: Record<string, MobileVariantGroup>; // key = model + storage
}

export interface MobileScrapeResult {
  competitor: string;
  models: Record<string, MobileModelGroup>; // key = model name
}


/* --------------------------- Helper: Mobile Variant --------------------------- */

function extractMobileModelAndStorage(title: string) {
  const lower = title.toLowerCase();

  // Find all GB/TB occurrences (e.g. 4GB, 64GB, 1TB)
  const matches = [...lower.matchAll(/(\d+(?:\.\d+)?)(tb|gb)\b/gi)];

  let storage: string | null = null;
  let rawModel = lower;

  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    storage = `${parseFloat(lastMatch[1])}${lastMatch[2].toUpperCase()}`;
    rawModel = lower.slice(0, lastMatch.index).trim();
  }

  // Clean model name
  let cleanModel = rawModel
    .replace(/\(.*?\)/g, '')                           // remove parentheses
    .replace(/\b(dual sim|5g|4g|unlocked|android phones|sim free|phone|smartphone)\b/g, '')
    .replace(/\b(black|blue|graphite|white|silver|gold|green|purple|red|pink|awesome|phantom|obsidian|prime|denim)\b/g, '')
    .replace(/\b(a|b|c|good|excellent|grade|condition)\b/g, '')
    .replace(/\s{2,}/g, ' ')                           // collapse spaces
    .replace(/[,/]+$/g, '')                            // remove trailing commas/slashes
    .trim();

  // Capitalize nicely
  cleanModel = cleanModel
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return { model: cleanModel, storage };
}


export function parseMobileVariantKey(title: string): string {
  const { model, storage } = extractMobileModelAndStorage(title);
  return storage ? `${model} ${storage}` : model;
}


/* --------------------------- Types --------------------------- */


export function transformScrapeResultToMobileScrapeResult(
  scrapeResult: ScrapeResult
): MobileScrapeResult {
  const { competitor, results } = scrapeResult;

  const genericModels = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const { model, storage } = extractMobileModelAndStorage(item.title);
    const variantKey = storage ? `${model} ${storage}` : model;
    return { model, variant: variantKey, extra: { storage } };
  });

  // ✅ Map generic structure → Mobile-specific structure
  const models: Record<string, MobileModelGroup> = Object.fromEntries(
    Object.entries(genericModels).map(([modelKey, grouped]) => [
      modelKey,
      {
        model: grouped.model,
        variants: Object.fromEntries(
          Object.entries(grouped.variants).map(([variantKey, v]) => [
            variantKey,
            {
              variant: v.variant ?? variantKey,
              storage: v.extra?.storage ?? null,
              listings: v.listings,
            },
          ])
        ),
      },
    ])
  );

  return { competitor, models };
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
  options: MobileSearchOptions,
): Promise<MobileScrapeResult> {
  const { competitor, item, attributes, broad, subcategory, priceRanges = defaultMobilePriceRanges } = options;

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
