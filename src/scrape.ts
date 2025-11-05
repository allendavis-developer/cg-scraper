import { setupPlaywright } from "./utils/playwright";
import { getMobileResults } from "./scrapers/mobileScraper";
import { getGameResults } from "./scrapers/gameScraper";
import { logScrapePlan } from "./utils/logUtils";

(async () => {
  const { browser, page } = await setupPlaywright(false); // headless by default
  const startTime = Date.now();

  try {
    const result = await getMobileResults(browser, {
      competitor: "CEX",
      item: "iPhone",
      category: "smartphones and mobile",
      subcategory: "Legacy iPhones",
      broad: true, // scrape all pages
    });

    // const gamesResult = await getGameResults(browser, {
    //   competitor: "CEX",
    //   item: "",
    //   category: "games (discs/cartridges)",
    //   subcategory: "switch games",
    //   broad: true, 
    // });

    console.log(result);

  } catch (error) {
    console.error("❌ Scraping failed:", error);
  } finally {
    await browser.close();
  }
})();
