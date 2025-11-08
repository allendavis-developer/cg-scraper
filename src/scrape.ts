import { setupPlaywright } from "./utils/playwright";
import { getMobileResults, transformScrapeResultToMobileScrapeResult } from "./scrapers/mobileScraper";
import { getGameResults } from "./scrapers/gameScraper";
import { uploadScrapeResultToDjango } from "./uploadToDjango";
import util from 'util';
import fs from "fs/promises";

(async () => {
  const { browser, page } = await setupPlaywright(false); // headless by default
  const startTime = Date.now();

  try {
    const result = await getGameResults(browser, {
      competitor: "CEX",
      item: "",
      category: "games (discs/cartridges)",
      subcategory: "Switch Games",
      broad: false,
    });

    // const result = await getMobileResults(browser, {
    //   competitor: "CEX",
    //   item: "",
    //   category: "smartphones and mobile",
    //   subcategory: "iPhone 14",
    //   broad: true,
    // });

    console.log(util.inspect(result, { depth: null, colors: true }));


    //   // --- Save to JSON file ---
    const filePath = "./scrapeResult.json";
    await fs.writeFile(filePath, JSON.stringify(result, null, 2));

    // --- Read and parse the JSON file back into an object ---
    const fileBuffer = await fs.readFile(filePath);
    const parsedResult = JSON.parse(fileBuffer.toString());

    // --- Upload parsed object (type stays consistent) ---
    await uploadScrapeResultToDjango(parsedResult, {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Switch Games",
    });


  } catch (error) {
    console.error("❌ Scraping failed:", error);
  } finally {
    await browser.close();
  }
})();
