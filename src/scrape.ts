// main.ts
import { setupPlaywright } from "./utils/playwright";
import { getMobileResults, logScrapePlan } from "./utils/getMobileResults";

(async () => {
  const { browser, page } = await setupPlaywright(true);
  const startTime = Date.now();

  // Broad scrape gets ALL results page
  const broad = await getMobileResults(page, {
    competitor: "CEX",
    item: "iPhone",
    category: "smartphones and mobile",
    subcategory: "Legacy iPhones",
    broad: true,
  });


  if (broad.models) {
    logScrapePlan(broad.models, startTime);
  } else {
    console.log("No detailed models to log.");
    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Scraping completed in ${durationSeconds} seconds.`);
  }


  await browser.close();
})();


