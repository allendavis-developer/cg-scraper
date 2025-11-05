import { setupPlaywright } from "./utils/playwright";
import { getMobileResults } from "./scrapers/mobileScraper";
import { getGameResults } from "./scrapers/gameScraper";
import { logScrapePlan } from "./utils/logUtils";

(async () => {
  const { browser, page } = await setupPlaywright(false); // headless by default
  const startTime = Date.now();

  try {
    // const result = await getMobileResults(page, {
    //   competitor: "CEX",
    //   item: "iPhone 14",
    //   category: "smartphones and mobile",
    //   subcategory: "iPhone 14",
    //   broad: true, // scrape all pages
    // });

    const gamesResult = await getGameResults(browser, {
      competitor: "CEX",
      item: "",
      category: "games (discs/cartridges)",
      subcategory: "switch games",
      broad: true, 
    });

    console.log(gamesResult.variants);

    if (gamesResult.variants?.length) {
      logScrapePlan(gamesResult.variants, startTime);
    } else {
      console.log(`✅ Scraped ${gamesResult.results.length} results (no variant grouping).`);
    }


  } catch (error) {
    console.error("❌ Scraping failed:", error);
  } finally {
    await browser.close();
  }
})();
