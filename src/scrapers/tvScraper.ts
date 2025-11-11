import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { ScrapeResult, CompetitorListing, groupResultsByVariant, scrapeAllPriceRangesCEX } from "./baseScraper";

/* --------------------------- Attribute Extraction --------------------------- */

export interface TVAttributes {
  brand: string;
  model: string;
  size?: string | null;
}

/**
 * Extract structured TV attributes from title
 * Example titles:
 * - "Generic 40\" LED TV, B"
 * - "Hisense 43E6NTUK 43\" 4K UHD Smart LED TV, B"
 * - "Toshiba 32WV2463DB 32\" HD Ready Smart LED TV, A"
 */
export function extractTVAttributes(title: string): TVAttributes {
  // Remove commas and extra spaces
  const cleanTitle = title.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  // Extract size (e.g. 32", 43", 50.5")
  const sizeMatch = cleanTitle.match(/(\d{2}(\.\d+)?)["”]/);
  const size = sizeMatch ? `${sizeMatch[1]}"` : null;

  // Split into words
  const words = cleanTitle.split(" ");

  // Brand is first word
  const brand = words[0];

  // Model is everything up to the size
  let model = words.slice(1).join(" ");
  if (size) {
    model = model.split(size)[0].trim();
  }

  return { brand, model, size };
}

/* -------------------------- Variant Key Generation -------------------------- */

export function parseTVVariantKey(title: string): string {
  const { brand, model, size } = extractTVAttributes(title);
  return [brand, model, size].filter(Boolean).join(" ");
}

/* ----------------------------- Type Definitions ----------------------------- */

export interface TVSearchOptions {
  competitor: "CEX";
  item: string;                 // e.g. "Samsung", "Hisense"
  category: "tv";
  broad?: boolean;              // Whether to use multiple price ranges
  subcategory?: string;
  priceRanges?: [number, number][];
}

export interface TVVariantGroup {
  variant: string;
  size?: string | null;
  listings: CompetitorListing[];
}

export interface TVModelGroup {
  model: string;
  variants: Record<string, TVVariantGroup>;
}

export interface TVScrapeResult {
  competitor: string;
  models: Record<string, TVModelGroup>;
}

/* --------------------------- Result Transformation -------------------------- */

export function transformScrapeResultToTVScrapeResult(
  scrapeResult: ScrapeResult
): TVScrapeResult {
  const { competitor, results } = scrapeResult;

  const groupedByVariant = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const attrs = extractTVAttributes(item.title);
    return {
      model: `${attrs.brand} ${attrs.model}`,
      variant: parseTVVariantKey(item.title),
      extra: { size: attrs.size },
    };
  });

  const models: Record<string, TVModelGroup> = {};

  Object.values(groupedByVariant).forEach(group => {
    const modelKey = group.model;
    if (!models[modelKey]) {
      models[modelKey] = { model: modelKey, variants: {} };
    }

    Object.values(group.variants).forEach(v => {
      const variantKey = v.variant ?? "unknown";

      models[modelKey].variants[variantKey] = {
        variant: variantKey,
        size: v.extra?.size ?? null,
        listings: v.listings,
      };
    });
  });

  return { competitor, models };
}

/* --------------------------- Default Price Ranges --------------------------- */

const defaultTVPriceRanges: [number, number][] = [
  [0, 50],
  [51, 100],
  [101, 200],
  [201, 400],
  [401, 800],
  [801, 1500],
];

/* ------------------------------- Main Scraper ------------------------------- */

export async function getTVResults(
  browser: Browser,
  options: TVSearchOptions
) {
  const { competitor, item, broad, subcategory, priceRanges = defaultTVPriceRanges } = options;

  if (competitor !== "CEX") throw new Error(`Unsupported competitor: ${competitor}`);

  const searchParams: any = { item, category: "tv" };
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
      priceRanges,
      parseTVVariantKey,
      3
    );
    scrapeResult = { competitor, results };
  }

  return transformScrapeResultToTVScrapeResult(scrapeResult);
}
