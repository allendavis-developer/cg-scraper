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

export interface HeadphoneSearchOptions {
  competitor: "CEX";
  item: string;
  category: "headphones";
  broad?: boolean;
  subcategory?: string;
  priceRanges?: [number, number][];
}

export interface HeadphoneVariantGroup {
  variant: string; // e.g. "WH-1000XM5" or "A3047+A3048"
  listings: CompetitorListing[];
}

export interface HeadphoneModelGroup {
  model: string; // Cleaned model name with useful identifiers
  variants: Record<string, HeadphoneVariantGroup>;
}

export interface HeadphoneScrapeResult {
  competitor: string;
  models: Record<string, HeadphoneModelGroup>;
}

/* --------------------------- Helper Extraction --------------------------- */

function extractHeadphoneModel(title: string) {
  // Extract all model identifiers (e.g. A3047, R510, WH-1000XM4)
  const modelMatches = title.match(/\b[A-Z]{1,3}-?\d{3,5}[A-Z]{0,3}\b/g) || [];
  const uniqueModels = Array.from(new Set(modelMatches));

  let modelNumber = "";

  // Check if this is an Apple AirPods product
  const isAirPods = /apple\s+airpods/i.test(title);

  if (isAirPods) {
    // Special logic for AirPods
    if (uniqueModels.length === 0) {
      modelNumber = "";
    } else if (uniqueModels.length === 1) {
      modelNumber = uniqueModels[0];
    } else if (uniqueModels.length === 2) {
      // Two models - left+right (no case)
      modelNumber = uniqueModels.sort().join("+");
    } else if (uniqueModels.length == 3) {
      console.log(uniqueModels);
      // Three or more models - find case model
      let caseModel: string | undefined;
      
      // Look for case model in parentheses: (USB-C Case A2968) or (Lightning Charging Case A2897)
      for (const m of uniqueModels) {
        const caseInParens = new RegExp(`\\([^)]*case[^)]*${m}[^)]*\\)`, "i");
        if (caseInParens.test(title)) {
          caseModel = m;
          break;
        }
      }

      // If not found, look for pattern like "Lightning Charging Case A2897" or "USB-C Case A3058"
      if (!caseModel) {
        for (const m of uniqueModels) {
          const caseOutside = new RegExp(`(lightning|usb-c|wired|wireless|magsafe).*case.*${m}|${m}.*case`, "i");
          if (caseOutside.test(title)) {
            caseModel = m;
            break;
          }
        }
      }

      // Order: case first if found, then others sorted
      if (caseModel) {
        const others = uniqueModels.filter((m) => m !== caseModel).sort();
        modelNumber = [caseModel, ...others].join("+");
        console.log(modelNumber);
      } else {
        // No case identified, just sort all
        modelNumber = uniqueModels.sort().join("+");
      }
    }
  } else {
    // Non-AirPods logic (Samsung, Sony, Bose, etc.)
    if (uniqueModels.length === 0) {
      modelNumber = "";
    } else if (uniqueModels.length === 1) {
      modelNumber = uniqueModels[0];
    } else if (uniqueModels.length === 2) {
      modelNumber = uniqueModels.sort().join("+");
    } else {
      modelNumber = uniqueModels.sort().join("+");
    }
  }

  // Clean up title - remove conditions, colors, and descriptors
  let cleanTitle = title
    // Remove any model identifiers like A2564, WH-1000XM4, etc.
    .replace(/\b[A-Z]{1,3}-?\d{3,5}[A-Z]{0,3}\b/g, "")
    // Remove plus signs
    .replace(/\+/g, "")
    // Remove any parentheses without model numbers (like colors, conditions)
    .replace(/\((?!.*[A-Z]\d{3,}).*?\)/g, "")
    // Remove condition grades and descriptors
    .replace(/\b[A-C]\b/g, "")
    .replace(/\b(mint|good|working|excellent|grade|condition)\b/gi, "")
    // Remove type descriptors
    .replace(/\b(in[-\s]?ear|on[-\s]?ear|over[-\s]?ear|wireless|bluetooth|noise[-\s]?cancell(?:ing|ation)|anc|headphones?|earphones?|earbuds?|charging|case|magsafe|connector|lightning|usb-c|wired)\b/gi, "")
    // Remove colors
    .replace(/\b(black|white|silver|graphite|phantom|midnight|starlight|pink|blue|green|purple|red|gold|space|grey)\b/gi, "")
    // Remove punctuation and tidy up
    .replace(/[(),]/g, "")
    .replace(/[-,]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();



  // Build final model: product name + model number (if exists and not already in title)
  let model;
  if (!modelNumber) {
    model = cleanTitle.trim();
  } else if (cleanTitle.includes(modelNumber)) {
    // Model number already in the product name (e.g., Sony WH-1000XM4)
    model = cleanTitle.trim();
  } else {
    // Model number not in product name, append it
    model = `${cleanTitle} ${modelNumber}`.trim();
  }

  return { model, modelNumber };
}

export function parseHeadphoneVariantKey(title: string): string {
  const { model, modelNumber } = extractHeadphoneModel(title);
  return [model, modelNumber].filter(Boolean).join(" ");
}

/* --------------------------- Transformer --------------------------- */

export function transformScrapeResultToHeadphoneScrapeResult(
  scrapeResult: ScrapeResult
): HeadphoneScrapeResult {
  const { competitor, results } = scrapeResult;

  // ✅ Keep only "B" condition listings
  const filtered = (results as CompetitorListing[]).filter((item) =>
    /\bB\b/i.test(item.title)
  );

  const grouped = groupResultsByVariant(filtered, (item) => {
  const { model, modelNumber } = extractHeadphoneModel(item.title);

  return { 
    model: model, 
    variant: model // Variant key = full model name
    };
  });


  const models: Record<string, HeadphoneModelGroup> = Object.fromEntries(
    Object.entries(grouped).map(([modelKey, grouped]) => {
      const variants = Object.fromEntries(
        Object.entries(grouped.variants).map(([variantKey, v]) => [
          variantKey || modelKey,
          {
            variant: variantKey || modelKey,
            listings: v.listings,
          },
        ])
      );

      return [
        modelKey,
        {
          model: modelKey,
          variants,
        },
      ];
    })
  );

  return { competitor, models };
}


/* --------------------------- Default Price Ranges --------------------------- */

const defaultHeadphonePriceRanges: [number, number][] = [
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

export async function getHeadphoneResults(
  browser: Browser,
  options: HeadphoneSearchOptions
): Promise<HeadphoneScrapeResult> {
  const { competitor, item, broad, subcategory, priceRanges = defaultHeadphonePriceRanges } = options;

  if (competitor !== "CEX") {
    throw new Error(`Unsupported competitor: ${competitor}`);
  }

  const searchParams: any = {
    item,
    category: "headphones",
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

    // ✅ Filter out non-B before saving
    const filteredResults = results.filter((r) => /\bB\b/i.test(r.title));
    scrapeResult = { competitor, results: filteredResults };
  } else {
    const { results, variants } = await scrapeAllPriceRangesCEX(
      browser,
      baseUrl,
      priceRanges,
      parseHeadphoneVariantKey,
      3
    );

    // ✅ Filter out non-B before transformation
    const filteredResults = results.filter((r) => /\bB\b/i.test(r.title));
    scrapeResult = { competitor, results: filteredResults, variants };
  }

  return transformScrapeResultToHeadphoneScrapeResult(scrapeResult);
}
