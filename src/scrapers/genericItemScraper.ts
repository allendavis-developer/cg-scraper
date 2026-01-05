import { Browser, Page, BrowserContext } from "playwright";
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

  function stripCommas(value: string): string {
    return value.replace(/,/g, "").replace(/\s+/g, " ").trim();
  }


  const grouped = groupResultsByVariant(
    results as (CEXProduct & { condition?: string | null })[],
    (item) => {
      const rawModel = item.title.trim();
      const model = stripCommas(rawModel);

      const variant = stripCommas(
        item.condition ? `${model} ${item.condition}` : model
      );

      return { model, variant };
    }
  );

  const models: Record<string, GenericModelGroup> = Object.fromEntries(
    Object.entries(grouped).map(([modelKey, grouped]) => [
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
    ])
  );

  return { competitor, models };
}

/* --------------------------- Main Entry --------------------------- */

export async function getGenericItemResults(
  context: BrowserContext,  // Changed parameter
  options: GenericItemSearchOptions
): Promise<GenericScrapeResult> {
  const {
    competitor,
    item,
    category,
    attributes,
    broad,
    subcategory,
  } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const searchParams: any = { item, category, attributes };
  if (subcategory) searchParams.subcategory = subcategory;

  const baseUrl = cex.searchUrl(searchParams);
  console.log(`Navigating to: ${baseUrl}`);

  let scrapeResult: ScrapeResult;

  const conditionRegex =
    /\s*,?\s*(A|B|C|BOXED|UNBOXED|DISCOUNTED)$/i;

  if (!broad) {
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const { container, title, price, url } = cex.selectors;
    let results = await scrapeCEX(page, container, title, price, url);
    await page.close();

    // 🔍 Filter and cast to CEXProduct[]
    const filteredResults = results.map((r) => {
      const match = r.title.trim().match(conditionRegex);

      const condition = match ? match[1].toUpperCase() : null;
      
      return {
        ...r,
        title: r.title,
        competitor: "CEX",
        condition, // 👈 THIS is the missing piece
      };
    });

    scrapeResult = { competitor, results: filteredResults };
  } else {
    const { results, variants } = await scrapeAllPriceRangesCEX(
      context,
      baseUrl,
      (title) => title.trim(),
      3
    );

    const filteredResults: CEXProduct[] = results
      .map((r) => {
        const match = r.title.trim().match(conditionRegex);

        const condition = match ? match[1].toUpperCase() : null;
        const cleanTitle = r.title.replace(conditionRegex, "").trim();

        return {
          ...r,
          title: cleanTitle,
          competitor: "CEX",
          condition, // 👈 keep it
        } as CEXProduct & { condition: string | null };
    });

    scrapeResult = { competitor, results: filteredResults, variants };
  }

  return transformScrapeResultToGenericScrapeResult(scrapeResult);
}
