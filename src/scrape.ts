import { setupPlaywright } from "./utils/playwright";
import { getMobileResults, transformScrapeResultToMobileScrapeResult } from "./scrapers/mobileScraper";
import { getGameResults } from "./scrapers/gameScraper";
import { logScrapePlan } from "./utils/logUtils";
import util from 'util';

(async () => {
  const { browser, page } = await setupPlaywright(false); // headless by default
  const startTime = Date.now();

  try {
    const result = await getMobileResults(browser, {
      competitor: "CEX",
      item: "",
      category: "smartphones and mobile",
      subcategory: "iPhone 11",
      broad: true,
    });

  console.log(util.inspect(result, { depth: null, colors: true }));

  
  } catch (error) {
    console.error("❌ Scraping failed:", error);
  } finally {
    await browser.close();
  }
})();
