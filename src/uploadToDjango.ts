import fetch from "node-fetch"; // npm i node-fetch if needed
import { MobileScrapeResult } from "./scrapers/mobileScraper"; // adjust import to your path

/**
 * Sends the result from getMobileResults() to Django.
 */
export async function uploadMobileScrapeResultToDjango(
  scrapeResult: MobileScrapeResult,
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
  const payloads: any[] = [];

  // Flatten the model/variant/listing hierarchy into smaller payloads per model
  for (const [modelName, modelGroup] of Object.entries(scrapeResult.models)) {
    for (const [variantKey, variant] of Object.entries(modelGroup.variants)) {
      const itemName = `${modelName} ${variant.storage ?? ""}`.trim();

      payloads.push({
        item_name: itemName,
        category_name: categoryName,
        subcategory_name: subcategoryName, // e.g. “iPhone 11” = subcategory
        model_name: modelName,       // matches ItemModel
        results: variant.listings.map((listing) => ({
          competitor: listing.competitor,
          title: listing.title,
          url: listing.url,
          price: listing.price,
          condition: listing.condition ?? "",
          store: listing.store ?? "",
          stable_id: listing.id, // CeX-style id
        })),
      });
    }
  }

  // Send each variant's data to Django
  for (const payload of payloads) {
    console.log(`Sending ${payload.item_name} to Django...`);
    const res = await fetch(djangoUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(
      `${payload.item_name} → Django responded:`,
      JSON.stringify(data, null, 2)
    );
  }
}
