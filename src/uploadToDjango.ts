import fetch from "node-fetch"; // npm i node-fetch if needed
import { MobileScrapeResult } from "./scrapers/mobileScraper"; // adjust import to your path
import { GameScrapeResult } from "./scrapers/gameScraper"; // adjust import to your path
import { BaseVariant } from "./scrapers/baseScraper"; // adjust import to your path

/**
 * Sends scrape result to Django
 */
export async function uploadScrapeResultToDjango(
  scrapeResult: MobileScrapeResult | GameScrapeResult,
  {
    categoryName,
    subcategoryName,
    djangoUrl = "http://127.0.0.1:8000/api/save-overnight-scraped-data/",
  }: {
    categoryName: string;
    subcategoryName: string;
    djangoUrl?: string;
  }
) {
  const payload: any = {
    category_name: categoryName,
    subcategory_name: subcategoryName,
    results: [],
  };

  for (const [modelName, modelGroup] of Object.entries(scrapeResult.models)) {
    for (const [variantKey, variantRaw] of Object.entries(modelGroup.variants)) {
      const variant = variantRaw as BaseVariant;
      const itemName = variant.variant!;

      payload.results.push({
        item_name: itemName,
        model_name: modelName,
        listings: variant.listings.map((listing) => ({
          competitor: listing.competitor,
          stable_id: listing.id,
          title: listing.title,
          price: listing.price,
          url: listing.url,
          condition: listing.condition ?? "",
          store: listing.store ?? "",
        })),
      });
    }
  }

  console.log(`Sending all variants to Django...`);
  const res = await fetch(djangoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Django responded:", JSON.stringify(data, null, 2));

}
