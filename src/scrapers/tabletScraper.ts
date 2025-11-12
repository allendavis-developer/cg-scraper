import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import {
  scrapeAllPriceRangesCEX,
  ScrapeResult,
  CompetitorListing,
  groupResultsByVariant,
} from "./baseScraper";

/* ----------------------------- Type Definitions ----------------------------- */

export interface TabletSearchOptions {
  competitor: "CEX";
  item: string;
  category: "tablets";
  attributes?: { storage?: string };
  broad?: boolean;
  subcategory?: string;
  priceRanges?: [number, number][]; // optional custom price ranges
}

export interface TabletVariantGroup {
  variant: string; // Full variant: "Apple iPad 9th Gen 10.2\" A2602 64GB WIFI"
  storage: string | null; // e.g., "64GB"
  listings: CompetitorListing[];
}

export interface TabletModelGroup {
  model: string; // Full model name with generation, size, etc.
  variants: Record<string, TabletVariantGroup>;
}

export interface TabletScrapeResult {
  competitor: string;
  models: Record<string, TabletModelGroup>;
}

/* --------------------------- Helper Extraction --------------------------- */

function extractModelAndStorage(title: string) {
  const lower = title.toLowerCase();

  // Grab largest storage
  const storageMatches = [...lower.matchAll(/(\d+(?:\.\d+)?)(tb|gb)\b/gi)];
  let storage: string | null = null;
  if (storageMatches.length) {
    let maxGB = 0;
    for (const match of storageMatches) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      const valueInGB = unit === "tb" ? value * 1024 : value;
      if (valueInGB > maxGB) {
        maxGB = valueInGB;
        storage = `${value}${unit.toUpperCase()}`;
      }
    }
  }

  // Remove everything we don't want in the model name
  let cleanTitle = title
    .replace(/\(.*?\)/g, "")           // remove anything in parentheses
    .replace(/\b\d+(?:\.\d+)?(tb|gb)\b/gi, "")  // remove storage
    .replace(/\b(wifi|4g|5g|lte|unlocked|sim free|no pen)\b/gi, "")  // network/connectivity
    .replace(/\b(black|blue|grey|gray|silver|gold|green|purple|red|pink|white|graphite|navy|space|oxford|denim|luna)\b/gi, "")  // colors
    .replace(/\b(good|excellent|grade|condition)\b/gi, "")  // condition words
    .replace(/\b[abc]\b/gi, "")  // standalone condition grades
    .replace(/\b(2016|2017|2018|2019|2020|2021|2022|2023|2024)\b/gi, "")  // years
    .replace(/[-,]\s*$/g, "")  // trailing dashes/commas
    .replace(/\s{2,}/g, " ")  // multiple spaces
    .trim();

  return { model: cleanTitle, storage };
}
export function parseTabletVariantKey(title: string): string {
  const { model, storage } = extractModelAndStorage(title);
  return [model, storage].filter(Boolean).join(" ");
}


/* --------------------------- Transformer --------------------------- */

export function transformScrapeResultToTabletScrapeResult(
  scrapeResult: ScrapeResult
): TabletScrapeResult {
  const { competitor, results } = scrapeResult;

  const grouped = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const { model, storage } = extractModelAndStorage(item.title);
    return { model, variant: storage || "", extra: { storage } };
  });

  const models: Record<string, TabletModelGroup> = Object.fromEntries(
    Object.entries(grouped).map(([modelKey, grouped]) => {
      return [
        modelKey, // model already includes model number
        {
          model: modelKey,
          variants: Object.fromEntries(
            Object.entries(grouped.variants).map(([variantKey, v]) => {
              const storage = v.extra?.storage ?? null;
              // ONLY append storage, do NOT append model number again
              const fullVariant = storage ? `${modelKey} ${storage}` : modelKey;

              return [
                fullVariant,
                {
                  variant: fullVariant,
                  storage,
                  listings: v.listings,
                },
              ];
            })
          ),
        },
      ];
    })
  );

  return { competitor, models };
}


/* --------------------------- Default Price Ranges --------------------------- */

const defaultTabletPriceRanges: [number, number][] = [
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
  [1501, 1750],
  [1751, 2000],
];


/* --------------------------- Main Entry --------------------------- */

export async function getTabletResults(
  browser: Browser,
  options: TabletSearchOptions
): Promise<TabletScrapeResult> {
  const { competitor, item, attributes, broad, subcategory, priceRanges = defaultTabletPriceRanges } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const searchParams: any = {
    item,
    category: "tablets",
    attributes,
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
    const { results, variants } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges,
      parseTabletVariantKey,
      3
    );
    scrapeResult = { competitor, results, variants };
  }

  return transformScrapeResultToTabletScrapeResult(scrapeResult);
}