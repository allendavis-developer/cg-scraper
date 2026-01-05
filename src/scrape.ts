import { setupPlaywright } from "./utils/playwright";
import { getGenericItemResults } from "./scrapers/genericItemScraper";


import { uploadScrapeResultToDjango } from "./uploadToDjango";
import util from 'util';
import fs from "fs/promises";

(async () => {
  const { browser, context, page } = await setupPlaywright(false); // headless by default
  const startTime = Date.now();

  try {

    const result = await getGenericItemResults(context, {
      competitor: "CEX",
      item: "",
      category: "",
      subcategory: "drone",
      broad: false,
    });


    console.log(util.inspect(result, { depth: null, colors: true }));
    // --- Save to JSON file ---
    const filePath = "./scrapeResult.json";
    await fs.writeFile(filePath, JSON.stringify(result, null, 2));


  } catch (error) {
    console.error("❌ Scraping failed:", error);
  } finally {
    await browser.close();
  }
})();
