import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { ScrapeResult, CompetitorListing, groupResultsByVariant, scrapeAllPriceRangesCEX } from "./baseScraper";

export interface ConsoleAttributes {
  model: string;
  storage: string | null;
  condition: "boxed" | "unboxed" | "discounted" | null;
  color?: string | null;
}

/**
 * Extracts model, storage, condition and optional color from console titles.
 * Example titles:
 * - "Playstation 4 Slim Console, 500GB Black, Unboxed"
 * - "Xbox Series X Console, 1TB, Boxed"
 * - "Nintendo Switch Lite Console, Yellow, Discounted"
 */
export function extractConsoleAttributes(title: string): ConsoleAttributes {
  const lower = title.toLowerCase();

  // Extract model portion (up to the word "Console")
  const modelMatch = lower.match(/^(.*?console)/i);
  let model = modelMatch ? modelMatch[1].replace(/console/i, "").trim() : title.trim();

  // ✅ Normalize common console naming inconsistencies
  if (/^switch lite\b/i.test(model)) model = "Nintendo Switch Lite";
  else if (/^(switch|nintendo switch)\b/i.test(model)) model = "Nintendo Switch";
  else if (/^playstation\s*4\b/i.test(model)) model = "PlayStation 4";
  else if (/^playstation\s*5\b/i.test(model)) model = "PlayStation 5";
  else if (/^xbox series x\b/i.test(model)) model = "Xbox Series X";
  else if (/^xbox series s\b/i.test(model)) model = "Xbox Series S";
  else if (/^xbox one x\b/i.test(model)) model = "Xbox One X";
  else if (/^xbox one s\b/i.test(model)) model = "Xbox One S";
  else if (/^xbox one\b(?!\s*[sx])/i.test(model)) model = "Xbox One";


  // Extract storage
  const storageMatch = lower.match(/(\d+(?:\.\d+)?)(tb|gb)/i);
  const storage = storageMatch ? `${parseFloat(storageMatch[1])}${storageMatch[2].toUpperCase()}` : null;

  // Extract condition (boxed, unboxed, discounted)
  const conditionMatch = lower.match(/\b(boxed|unboxed|discounted)\b/i);
  const condition = conditionMatch ? conditionMatch[1].toLowerCase() as ConsoleAttributes["condition"] : null;

  // Extract color (optional)
  const colorMatch = lower.match(/\b(black|white|red|blue|yellow|green|grey|gray|silver)\b/i);
  const color = colorMatch ? colorMatch[1] : null;

  return { model, storage, condition, color };
}

export function parseConsoleVariantKey(title: string): string {
  const { model, storage, condition } = extractConsoleAttributes(title);
  return [model, storage, condition].filter(Boolean).join(" ");
}


export interface ConsoleVariantGroup {
  variant: string;
  storage: string | null;
  condition: string | null;
  listings: CompetitorListing[];
}

export interface ConsoleModelGroup {
  model: string;
  variants: Record<string, ConsoleVariantGroup>;
}

export interface ConsoleScrapeResult {
  competitor: string;
  models: Record<string, ConsoleModelGroup>;
}

/**
 * Transforms flat scrape results → grouped ConsoleScrapeResult
 */
export function transformScrapeResultToConsoleScrapeResult(
  scrapeResult: ScrapeResult
): ConsoleScrapeResult {
  const { competitor, results } = scrapeResult;

  const genericModels = groupResultsByVariant(results as CompetitorListing[], (item) => {
    const { model, storage, condition } = extractConsoleAttributes(item.title);
    return { 
      model, 
      variant: [model, storage, condition].filter(Boolean).join(" "),
      extra: { storage, condition }
    };
  });

  const models: Record<string, ConsoleModelGroup> = Object.fromEntries(
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
              condition: v.extra?.condition ?? null,
              listings: v.listings,
            },
          ])
        ),
      },
    ])
  );

  return { competitor, models };
}

const defaultConsolePriceRanges: [number, number][] = [
  [0, 100],
  [101, 200],
  [201, 400],
  [401, 600],
  [601, 1000],
  [1001, 2000],
];

export interface ConsoleSearchOptions {
  competitor: "CEX";
  item: string; // e.g. "PlayStation 4", "Xbox One", "Nintendo Switch"
  category: "consoles";
  subcategory?: string; // ✅ added
  broad?: boolean;
  priceRanges?: [number, number][];
}


/**
 * Generic Console Scraper for any console brand (PlayStation, Xbox, Switch)
 */
export async function getConsoleResults(
  browser: Browser,
  options: ConsoleSearchOptions
): Promise<ConsoleScrapeResult> {
  const { competitor, item, broad, priceRanges, subcategory } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  // ✅ pass subcategory to CEX search URL
  const searchParams: any = {
    item,
    category: "consoles",
  };

  if (subcategory) searchParams.subcategory = subcategory;

  const baseUrl = cex.searchUrl(searchParams);
  console.log(`Navigating to: ${baseUrl}`);

  let scrapeResult: ScrapeResult;

  if (!broad) {
    // Single scrape
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    const results = await scrapeCEX(page, container, title, price, url);
    await page.close();
    scrapeResult = { competitor, results };
  } else {
    // Broad scrape (multi-range)
    const { results, variants } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges || defaultConsolePriceRanges,
      parseConsoleVariantKey,
      3
    );

    scrapeResult = { competitor, results, variants };
  }

  return transformScrapeResultToConsoleScrapeResult(scrapeResult);
}
