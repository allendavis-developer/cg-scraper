import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "./cex";
import {
  scrapeAllPriceRangesCEX,
  ScrapeResult,
  CompetitorListing,
  groupResultsByVariant,
} from "./baseScraper";
import { CEXProduct } from "../scrapers/cex"; // adjust import as needed

/* ----------------------------- Type Definitions ----------------------------- */

export interface GenericItemSearchOptions {
  competitor: "CEX";
  item: string;
  category: string;
  attributes?: Record<string, string>;
  broad?: boolean;
  subcategory?: string;
  priceRanges?: [number, number][];
}

export interface GenericVariantGroup {
  variant: string; // full title (variant = model)
  listings: CEXProduct[];
}

export interface GenericModelGroup {
  model: string; // full title (model = variant)
  variants: Record<string, GenericVariantGroup>;
}

export interface GenericScrapeResult {
  competitor: string;
  models: Record<string, GenericModelGroup>;
}

/* --------------------------- Transformer --------------------------- */

export function transformScrapeResultToGenericScrapeResult(
  scrapeResult: ScrapeResult
): GenericScrapeResult {
  const { competitor, results } = scrapeResult;

  // Every item is its own "model" and "variant"
  const grouped = groupResultsByVariant(results as CEXProduct[], (item) => {
    const model = item.title.trim();
    const variant = item.title.trim();
    return { model, variant };
  });

  const models: Record<string, GenericModelGroup> = Object.fromEntries(
    Object.entries(grouped).map(([modelKey, grouped]) => {
      return [
        modelKey,
        {
          model: modelKey,
          variants: Object.fromEntries(
            Object.entries(grouped.variants).map(([variantKey, v]) => [
              variantKey,
              {
                variant: variantKey,
                listings: v.listings,
              },
            ])
          ),
        },
      ];
    })
  );

  return { competitor, models };
}

/* --------------------------- Default Price Ranges --------------------------- */

const defaultPriceRanges: [number, number][] = [
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

export async function getGenericItemResults(
  browser: Browser,
  options: GenericItemSearchOptions
): Promise<GenericScrapeResult> {
  const {
    competitor,
    item,
    category,
    attributes,
    broad,
    subcategory,
    priceRanges = defaultPriceRanges,
  } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const searchParams: any = { item, category, attributes };
  if (subcategory) searchParams.subcategory = subcategory;

  const baseUrl = cex.searchUrl(searchParams);
  console.log(`Navigating to: ${baseUrl}`);

  let scrapeResult: ScrapeResult;

  const conditionRegex = /,\s*([ABC])$/i;

  if (!broad) {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    let results = await scrapeCEX(page, container, title, price, url);
    await page.close();

    // 🔍 Filter and cast to CEXProduct[]
    const filteredResults: CEXProduct[] = results
      .map((r) => {
        const match = r.title.trim().match(conditionRegex);
        if (match) {
          const condition = match[1].toUpperCase();
          if (condition !== "B") return null; // skip non-B
          return { ...r, title: r.title.replace(conditionRegex, "").trim(), competitor: "CEX" } as const;
        }
        return { ...r, title: r.title.trim(), competitor: "CEX" } as const;
      })
      .filter(Boolean) as CEXProduct[];

    scrapeResult = { competitor, results: filteredResults };
  } else {
    const { results, variants } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges,
      (title) => title.trim(),
      3
    );

    const filteredResults: CEXProduct[] = results
      .map((r) => {
        const match = r.title.trim().match(conditionRegex);
        if (match) {
          const condition = match[1].toUpperCase();
          if (condition !== "B") return null;
          return { ...r, title: r.title.replace(conditionRegex, "").trim(), competitor: "CEX" } as const;
        }
        return { ...r, title: r.title.trim(), competitor: "CEX" } as const;
      })
      .filter(Boolean) as CEXProduct[];

    scrapeResult = { competitor, results: filteredResults, variants };
  }

  return transformScrapeResultToGenericScrapeResult(scrapeResult);
}
