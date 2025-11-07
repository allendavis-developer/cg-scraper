import { Browser } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import {
  scrapeAllPriceRangesCEX,
  ScrapeResult,
  CompetitorListing,
} from "./baseScraper";

/* ----------------------------- Type Definitions ----------------------------- */

export interface GameSearchOptions {
  competitor: "CEX";
  item: string;
  category: "games (discs/cartridges)";
  subcategory?: string; // e.g. "switch games"
  broad?: boolean;
}

export interface GameVariantGroup {
  variant: string | null; // e.g. "Deluxe Edition" or "Standard"
  listings: CompetitorListing[];
}

export interface GameModelGroup {
  model: string; // e.g. "The Legend of Zelda: Tears of the Kingdom"
  variants: Record<string, GameVariantGroup>; // key = variant name
}

export interface GameScrapeResult {
  competitor: string;
  models: Record<string, GameModelGroup>; // key = title
}

/* --------------------------- Helper --------------------------- */

// 🎮 Each game title itself is the variant
function parseGameVariantKey(title: string): string {
  return title.trim().toLowerCase(); // normalize to avoid duplicates
}

const priceRangesGames: [number, number][] = [
  [0, 10],
  [11, 20],
  [21, 30],
  [31, 40],
  [41, 50],
  [51, 200],
];

/* --------------------------- Transformer --------------------------- */

export function transformGameResults(
  scrapeResult: ScrapeResult,
  subcategory?: string
): GameScrapeResult {
  const { competitor, results } = scrapeResult;

  const models: Record<string, GameModelGroup> = {};

  for (const listing of results) {
    const normalizedTitle = listing.title.trim().toLowerCase();
    const subcatPrefix = subcategory ? `${subcategory.trim()} ` : "";
    const variantKey = `${subcatPrefix}${normalizedTitle}`;

    if (!models[normalizedTitle]) {
      models[normalizedTitle] = {
        model: normalizedTitle,
        variants: {},
      };
    }

    if (!models[normalizedTitle].variants[variantKey]) {
      models[normalizedTitle].variants[variantKey] = {
        variant: variantKey,
        listings: [],
      };
    }

    models[normalizedTitle].variants[variantKey].listings.push(listing);
  }

  return { competitor, models };
}


/* --------------------------- Main Entry --------------------------- */

export async function getGameResults(
  browser: Browser,
  options: GameSearchOptions
): Promise<GameScrapeResult> {
  const { competitor, item, broad, subcategory } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const searchParams: any = { item, category: "games (discs/cartridges)" };
  if (subcategory) searchParams.subcategory = subcategory;

  const baseUrl = cex.searchUrl(searchParams);
  console.log(`Navigating to: ${baseUrl}`);

  // Single-page scrape
  if (!broad) {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    const results = await scrapeCEX(page, container, title, price, url);
    await page.close();

    // ✅ Transform before returning
    return transformGameResults({ competitor, results }, subcategory);
  }

  // Multi-page scrape (parallel)
  const { results, variants } = await scrapeAllPriceRangesCEX(
    browser,
    baseUrl,
    priceRangesGames,
    parseGameVariantKey,
    3
  );

  const scrapeResult: ScrapeResult = { competitor, results, variants };
  return transformGameResults(scrapeResult, subcategory);
}
