import { Page } from "playwright";
import { cex, cexBroadSearchUrl } from "../competitors/cex";
import { scrapeCEX } from "../scrapers/cex";

interface SearchOptions {
  competitor: "CEX"; // later you can add: | "CashConverters" | "eBay" etc.
  item: string;
  category: string;
  attributes?: Record<string, string>;
  broad?: boolean;
  subcategory?: string;
}

export async function getResults(page: Page, options: SearchOptions) {
  const { competitor, item, category, attributes, broad, subcategory } = options;

  switch (competitor) {
    case "CEX": {
      const url = broad
        ? cexBroadSearchUrl(item, subcategory || item)
        : cex.searchUrl({ item, category, attributes });

      console.log(`Navigating to: ${url}`);
      await page.goto(url);

      const { container, title, price, url: urlSel } = cex.selectors;
      const results = await scrapeCEX(page, container, title, price, urlSel);

      return { competitor, results };
    }

    default:
      throw new Error(`Unsupported competitor: ${competitor}`);
  }
}
