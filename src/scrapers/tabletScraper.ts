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

function extractTabletModelDetails(title: string) {
  const lower = title.toLowerCase();

  // Extract model number (A2602, SM-X210, TB-X103F, T580, P615, etc.)
  const modelMatch = lower.match(/\b(a\d{4}|sm-[a-z0-9]+|tb-[a-z0-9]+|t[0-9]{3,}|p[0-9]{3,}|x[0-9]{3,})\b/i);
  const modelNumber = modelMatch ? modelMatch[0].toUpperCase() : null;
  // Extract storage (take the largest GB/TB value)
  const storageMatches = [...lower.matchAll(/(\d+(?:\.\d+)?)(tb|gb)\b/gi)];
  let storage: string | null = null;

  if (storageMatches.length) {
    let maxBytes = 0;
    for (const match of storageMatches) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      // convert everything to GB for comparison
      const valueInGB = unit === "tb" ? value * 1024 : value;
      if (valueInGB > maxBytes) {
        maxBytes = valueInGB;
        storage = `${value}${unit.toUpperCase()}`;
      }
    }
  }


  // Extract network (WiFi / 5G / 4G / LTE / Unlocked)
  const networkMatch = lower.match(/\b(wifi|5g|4g|lte|unlocked)\b/i);
  const network = networkMatch ? networkMatch[1].toUpperCase() : null;

  // Clean marketing model name - keep generation, size, but remove storage, colors and conditions
  let cleanModel = lower
    .replace(/\(.*?\)/g, "") // Remove parentheses content
    .replace(/\b\d+(?:\.\d+)?(tb|gb)\b/gi, "") // Remove storage (e.g., 64GB, 128GB, 1TB)
    .replace(/\b(tab|tablet|android|wi[- ]?fi|unlocked|lte|5g|4g|sim free)\b/g, "")
    .replace(/\b(black|blue|grey|gray|silver|gold|green|purple|red|pink|white|graphite|navy|space|oxford|denim|luna)\b/g, "")
    .replace(/\b(good|excellent|grade|condition|b|a|c)\b/g, "")
    .replace(/,\s*$/g, "") // Remove trailing commas
    .replace(/[-,]\s*$/g, "") // Remove trailing dashes and commas
    .replace(/\s{2,}/g, " ")
    .trim();

  // Capitalize each word
  cleanModel = cleanModel
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return { model: cleanModel, modelNumber, storage, network };
}

export function parseTabletVariantKey(title: string): string {
  const { model, modelNumber, storage, network } = extractTabletModelDetails(title);
  const parts = [model, modelNumber, storage, network].filter(Boolean);
  return parts.join(" ");
}

/* --------------------------- Transformer --------------------------- */

export function transformScrapeResultToTabletScrapeResult(
  scrapeResult: ScrapeResult
): TabletScrapeResult {
  const { competitor, results } = scrapeResult;

  const grouped = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const { model, modelNumber, storage, network } = extractTabletModelDetails(item.title);
    
    const modelKey = model; // model without number
    const variantKey = [storage, network].filter(Boolean).join(" ");
    
    return { 
      model: modelKey, 
      variant: variantKey, 
      extra: { modelNumber, storage, network } 
    };
  });

  const models: Record<string, TabletModelGroup> = Object.fromEntries(
    Object.entries(grouped).map(([modelKey, grouped]) => {
      const firstVariant = Object.values(grouped.variants)[0];
      const modelNumber = firstVariant?.extra?.modelNumber ?? null;

      // Model key with number
      const modelKeyWithNumber = modelNumber 
        ? `${modelKey} ${modelNumber}` 
        : modelKey;

      return [
        modelKeyWithNumber,
        {
          // Include model number in the `model` field as well
          model: modelKeyWithNumber,
          variants: Object.fromEntries(
            Object.entries(grouped.variants).map(([variantKey, v]) => {
              const storage = v.extra?.storage ?? null;
              const network = v.extra?.network ?? null;

              const fullVariant = [modelKey, modelNumber, storage, network]
                .filter(Boolean)
                .join(" ");

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