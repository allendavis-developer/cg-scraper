import { Browser, Page } from "playwright";
import { cex } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";
import { scrapeAllPages, scrapeAllPriceRangesCEX, scrapeAllPagesParallel, ScrapeResult } from "./baseScraper";

/* ----------------------------- Type Definitions ----------------------------- */

export interface GameSearchOptions {
competitor: "CEX";
item: string;
category: "games (discs/cartridges)";
subcategory?: string; // e.g. "switch games"
broad?: boolean;
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


/* --------------------------- Main Entry --------------------------- */

export async function getGameResults(
browser: Browser,
options: GameSearchOptions
): Promise<ScrapeResult> {
const { competitor, item, broad, subcategory } = options;

if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
}

const searchParams: any = { item, category: "games (discs/cartridges)" };
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

// Multi-page scrape (parallel)
const { results, variants } = await scrapeAllPriceRangesCEX(
        browser,
        baseUrl,
        priceRangesGames,
        parseGameVariantKey,
        3
    );

return { competitor, results, variants };
}