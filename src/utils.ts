// utils.ts
import { Page } from "playwright";

/**
 * Parse price string like "£1,299.99" or "£399" → 1299.99 | 399
 */
export function parsePrice(text: string): number | null {
  if (!text) return null;

  if (text.includes(' to ')) {
    text = text.split(' to ')[0];
  }

  const cleaned = text.replace(/[£,()]/g, '').trim();
  const match = cleaned.match(/\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Extract product ID from card element depending on competitor
 */
export function extractId(card: HTMLElement, competitor: string): string | null {
  if (!card) return null;

  switch (competitor) {
    case "CashGenerator":
      return card.getAttribute('data-original-product-id') ||
             (card.id ? card.id.replace(/\D/g, '') : null);
    case "CashConverters":
      const urlEl = card.querySelector('a');
      if (urlEl?.getAttribute('href')) {
        const match = urlEl.getAttribute('href')!.match(/\/(\d+)(?:\/)?$/);
        return match ? match[1] : null;
      }
      return null;
    case "CEX":
      const urlCEX = card.querySelector('a');
      if (urlCEX?.getAttribute('href')) {
        const match = urlCEX.getAttribute('href')!.match(/[?&]id=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
      }
      return null;
    case "eBay":
      const urlEB = card.querySelector('a[href*="/itm/"]') as HTMLAnchorElement | null;
      if (urlEB) {
        const match = urlEB.href.match(/\/itm\/(\d+)/);
        return match ? match[1] : null;
      }
      return null;
    default:
      return null;
  }
}

/**
 * Wait for selector to appear on a Playwright page, resolves after timeout
 */
export async function waitForSelector(page: Page, selector: string, timeout = 5000): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch {
    console.warn(`Selector "${selector}" not found after ${timeout}ms`);
  }
}
