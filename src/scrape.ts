import { setupPlaywright } from "./utils/playwright";
import { getMobileResults, transformScrapeResultToMobileScrapeResult } from "./scrapers/mobileScraper";
import { getGameResults } from "./scrapers/gameScraper";
import { getConsoleResults } from "./scrapers/consoleScraper";
import { getLaptopResults } from "./scrapers/laptopScraper";
import { getTabletResults } from "./scrapers/tabletScraper";
import { getTVResults } from "./scrapers/tvScraper";
import { getWatchResults } from "./scrapers/watchScraper";
import { getGenericItemResults } from "./scrapers/genericItemScraper";
import { getHeadphoneResults } from "./scrapers/earpodsHeadphonesScraper";
import { getSpeakerResults } from "./scrapers/bluetoothSpeakerScraper";


import { uploadScrapeResultToDjango } from "./uploadToDjango";
import util from 'util';
import fs from "fs/promises";

(async () => {
  const { browser, page } = await setupPlaywright(false); // headless by default
  const startTime = Date.now();

  try {

    const result = await getGenericItemResults(browser, {
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
