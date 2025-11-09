// scrapers/cex.ts
import { Page } from "playwright";
import { parsePrice } from "../utils";

export interface CEXProduct {
  competitor: "CEX";
  id: string | null;
  title: string;
  price: number | null;
  url: string | null;
  tradeVoucher?: number | null;
  tradeCash?: number | null;
}


/**
 * Scrape CEX search results from a page
 */
/**
 * Scrape CEX search results from a page
 */
export async function scrapeCEX(page: Page, containerSelector: string, titleSelector: string, priceSelector: string, urlSelector: string): Promise<CEXProduct[]> {
  const results: CEXProduct[] = [];
  const BASE_URL = "https://uk.webuy.com";

  // Wait for the main container to load
  await page.waitForSelector(containerSelector, { state: "attached", timeout: 10000 });

   // Wait for the number of cards to stabilize
    await page.waitForFunction(
      (sel) => {
        const counts: number[] = (window as any)._cardCounts || [];
        const current = document.querySelectorAll(sel).length;
        counts.push(current);
        (window as any)._cardCounts = counts.slice(-5);
        // Check if the last few counts are identical (stable)
        return counts.length >= 3 && counts.every((n) => n === counts[0]);
      },
      containerSelector,
      { timeout: 10000 }
    );

  // Turn on the Trade-in toggle (shows voucher & cash)
  const tradeInToggle = await page.$("div.trade-price-sort-panel .toggle-switch label span.slider");
  if (tradeInToggle) {
    await tradeInToggle.click();
    await page.waitForTimeout(500); // brief wait for re-render
  }


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
      const relativeUrl = urlEl ? await urlEl.getAttribute("href") : null;
      const grade = gradeEl ? (await gradeEl.innerText()).trim() : null;

      // Make URL absolute
      const url = relativeUrl
        ? relativeUrl.startsWith("http")
          ? relativeUrl
          : new URL(relativeUrl, BASE_URL).href
        : null;

        
        // Trade-in values
      const voucherEl = await card.$('.tradeInPrices p:first-child span');
      const cashEl = await card.$('.tradeInPrices p:nth-child(2) span');
      const tradeVoucher = voucherEl ? parsePrice(await voucherEl.innerText()) : null;
      const tradeCash = cashEl ? parsePrice(await cashEl.innerText()) : null;


      // Extract ID from URL query param `id`
      let id: string | null = null;
      if (url) {
        const match = url.match(/[?&]id=([^&]+)/);
        if (match) id = decodeURIComponent(match[1]);
      }

      // Only include products with grade B or missing grade
      if (!grade || grade == "B") {
        results.push({ competitor: "CEX", id, title, price, url, tradeVoucher, tradeCash });
      }
    } catch (err) {
      console.error("Error parsing CEX card:", err);
    }
  }

  return results;
}