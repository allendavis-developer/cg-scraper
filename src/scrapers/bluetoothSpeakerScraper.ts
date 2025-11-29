import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { ScrapeResult, CompetitorListing, groupResultsByVariant, scrapeAllPriceRangesCEX } from "./baseScraper";

/* ------------------------ Attribute Extraction ------------------------ */

export interface SpeakerAttributes {
  brand: string;
  model: string;
  variant?: string | null; // e.g., color, condition
}

/**
 * Extract structured speaker attributes from title
 * Example titles:
 * - "JBL Charge 5 Portable Bluetooth Speaker - Black, A"
 * - "Sony SRS-XB33 Portable Bluetooth Speaker - Blue, B"
 */
export function extractSpeakerAttributes(title: string): SpeakerAttributes {
  // Remove commas and extra spaces
  const cleanTitle = title.replace(/\s+/g, " ").trim();

  // Brand is first word
  const words = cleanTitle.split(" ");
  const brand = words[0];

  // Find keyword: either "Portable Bluetooth Speaker" or "Bluetooth Speaker"
  const keywordMatch = cleanTitle.match(/bluetooth/i);  let model = "";
  let variant: string | null = null;

  if (keywordMatch) {
    const keywordIndex = keywordMatch.index!;
    model = cleanTitle.substring(0, keywordIndex).trim(); // everything before keyword
  } else {
    // fallback: no keyword found, treat everything as model
    model = cleanTitle;
  }

  // Variant is now always the same as the model
  variant = model;

  return { brand, model, variant };
}



/* ------------------------ Variant Key Generation ------------------------ */

export function parseSpeakerVariantKey(title: string): string {
  const { model } = extractSpeakerAttributes(title);
  return model;
}

/* ------------------------ Result Transformation ------------------------ */

  export function transformScrapeResultToSpeakerScrapeResult(
    scrapeResult: ScrapeResult
  ): SpeakerScrapeResult {
    const { competitor, results } = scrapeResult;

    const groupedByVariant = groupResultsByVariant(results as CompetitorListing[], (item) => {
        const attrs = extractSpeakerAttributes(item.title);
        let variantKey = parseSpeakerVariantKey(item.title);

        // Remove trailing 'B' from variant key
        if (variantKey.endsWith("B")) {
          variantKey = variantKey.slice(0, -1).trim();
        }

        return {
        model: attrs.model,
        variant: variantKey,
        };
    });

    const models: Record<string, SpeakerModelGroup> = {};

    Object.values(groupedByVariant).forEach(group => {
      const modelKey = group.model;
      if (!models[modelKey]) {
        models[modelKey] = { model: modelKey, variants: {} };
      }

      Object.values(group.variants).forEach(v => {
        const variantKey = v.variant ?? "unknown";

        models[modelKey].variants[variantKey] = {
          variant: variantKey,
          listings: v.listings,
        };
      });
    });

    return { competitor, models };
  }


/* --------------------------- Type Definitions --------------------------- */

export interface SpeakerSearchOptions {
  competitor: "CEX";
  item: string;                 // e.g., "JBL", "Sony"
  category: "bluetooth speaker";
  broad?: boolean;
  subcategory?: string;
  priceRanges?: [number, number][];
}

export interface SpeakerVariantGroup {
  variant: string;
  listings: CompetitorListing[];
}

export interface SpeakerModelGroup {
  model: string;
  variants: Record<string, SpeakerVariantGroup>;
}

export interface SpeakerScrapeResult {
  competitor: string;
  models: Record<string, SpeakerModelGroup>;
}

/* ------------------------ Default Price Ranges ------------------------ */

const defaultSpeakerPriceRanges: [number, number][] = [
  [0, 50],
  [51, 100],
  [101, 200],
  [201, 400],
  [401, 800],
  [801, 1500],
];

/* --------------------------- Main Scraper --------------------------- */

export async function getSpeakerResults(
  browser: Browser,
  options: SpeakerSearchOptions
) {
  const { competitor, item, broad, subcategory, priceRanges = defaultSpeakerPriceRanges } = options;

  if (competitor !== "CEX") throw new Error(`Unsupported competitor: ${competitor}`);

  const searchParams: any = { item, category: "bluetooth-speaker" };
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
      parseSpeakerVariantKey,
      3
    );
    scrapeResult = { competitor, results };
  }

  return transformScrapeResultToSpeakerScrapeResult(scrapeResult);
}
