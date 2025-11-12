import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "./cex";
import {
  scrapeAllPriceRangesCEX,
  ScrapeResult,
  CompetitorListing,
  groupResultsByVariant,
} from "./baseScraper";

/* ----------------------------- Type Definitions ----------------------------- */

export interface WatchSearchOptions {
  competitor: "CEX";
  item: string;
  category: "watches";
  subcategory: string;
  broad?: boolean;
  priceRanges?: [number, number][];
}

export interface WatchVariantGroup {
  variant: string; // e.g., "Watch SE 2nd Gen (GPS) 44mm"
  size: string | null;
  listings: CompetitorListing[];
}

export interface WatchModelGroup {
  model: string;
  variants: Record<string, WatchVariantGroup>;
}

export interface WatchScrapeResult {
  competitor: string;
  models: Record<string, WatchModelGroup>;
}

/* --------------------------- Helper Extraction --------------------------- */

function extractWatchModelAndSize(title: string) {
  // Clean up junk like model codes, commas, and "NO STRAP"
  const clean = title
    .replace(/\(.*?\)|,|NO STRAP| - /gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Find size like "40mm", "47mm", etc.
  const matchSize = clean.match(/(\d{2,3})mm/i);
  const size = matchSize ? `${matchSize[1]}mm` : "N/A";

  // If we found a size, cut off text after it to isolate the model
  const modelPart = matchSize
    ? clean.split(new RegExp(`${matchSize[1]}mm`, "i"))[0]
    : clean;

  const model = modelPart.trim();

  return { model, size };
}

export function parseWatchVariantKey(title: string): string {
  const { model, size } = extractWatchModelAndSize(title);
  return [model, size].filter(Boolean).join(" ");
}

/* --------------------------- Transformer --------------------------- */

export function transformScrapeResultToWatchScrapeResult(
  scrapeResult: ScrapeResult
): WatchScrapeResult {
  const { competitor, results } = scrapeResult;

  const grouped = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const { model, size } = extractWatchModelAndSize(item.title);
    return { model, variant: size || "", extra: { size } };
  });

  const models: Record<string, WatchModelGroup> = Object.fromEntries(
    Object.entries(grouped).map(([modelKey, grouped]) => [
      modelKey,
      {
        model: modelKey,
        variants: Object.fromEntries(
          Object.entries(grouped.variants).map(([variantKey, v]) => {
            const size = v.extra?.size ?? null;
            const fullVariant = size ? `${modelKey} ${size}` : modelKey;
            return [
              fullVariant,
              {
                variant: fullVariant,
                size,
                listings: v.listings,
              },
            ];
          })
        ),
      },
    ])
  );

  return { competitor, models };
}

/* --------------------------- Default Price Ranges --------------------------- */

const defaultWatchPriceRanges: [number, number][] = [
  [0, 100],
  [101, 200],
  [201, 300],
  [301, 400],
  [401, 500],
  [501, 600],
  [601, 800],
  [801, 1000],
];

/* --------------------------- Main Entry --------------------------- */

export async function getWatchResults(
  browser: Browser,
  options: WatchSearchOptions
): Promise<WatchScrapeResult> {
  const { competitor, item, broad, priceRanges = defaultWatchPriceRanges } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

    const searchParams: any = {
        item,
        category: "watches",
    };

  if (options.subcategory) searchParams.subcategory = options.subcategory;  
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
    const { results, variants } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges,
      parseWatchVariantKey,
      3
    );
    scrapeResult = { competitor, results, variants };
  }

  return transformScrapeResultToWatchScrapeResult(scrapeResult);
}
