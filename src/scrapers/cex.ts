// scrapers/cex.ts
import { Page } from "playwright";
import { parsePrice } from "../utils";

export interface CEXProduct {
  competitor: "CEX";
  id: string | null;
  title: string;
  price: number | null;
  url: string | null;
}

/**
 * Scrape CEX search results from a page
 */
export async function scrapeCEX(page: Page, containerSelector: string, titleSelector: string, priceSelector: string, urlSelector: string): Promise<CEXProduct[]> {
  const results: CEXProduct[] = [];

  // Wait for the main container to load
  await page.waitForSelector(containerSelector, { state: "attached", timeout: 10000 });

  // Get all product cards
  const cards = await page.$$(containerSelector);
  
  for (const card of cards) {
    try {
      const titleEl = await card.$(titleSelector);
      const priceEl = await card.$(priceSelector);
      const urlEl = await card.$(urlSelector);
      const gradeEl = await card.$(".grade-letter");

      if (!titleEl || !priceEl) continue;

      const title = (await titleEl.innerText()).trim();
      const priceText = (await priceEl.innerText()).trim();
      const price = parsePrice(priceText);
      const url = urlEl ? await urlEl.getAttribute("href") : null;
      const grade = gradeEl ? (await gradeEl.innerText()).trim() : null;

      // Extract ID from URL query param `id`
      let id: string | null = null;
      if (url) {
        const match = url.match(/[?&]id=([^&]+)/);
        if (match) id = decodeURIComponent(match[1]);
      }

      // Only include products with grade B or missing grade
      if (!grade || grade == "B") {
        results.push({ competitor: "CEX", id, title, price, url });
      }
    } catch (err) {
      console.error("Error parsing CEX card:", err);
    }
  }

  return results;
}
