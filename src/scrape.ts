// main.ts
import { setupPlaywright } from "./utils/playwright";
import { getMobileResults, logScrapePlan } from "./utils/getMobileResults";

(async () => {
  const { browser, page } = await setupPlaywright(true);
  const startTime = Date.now();

  // // Broad scrape gets ALL results page
  // const broad = await getMobileResults(page, {
  //   competitor: "CEX",
  //   item: "iPhone",
  //   category: "smartphones and mobile",
  //   subcategory: "Legacy iPhones",
  //   broad: true,
  // });

  // if (broad.models) {
  //   logScrapePlan(broad.models, startTime);
  // } else {
  //   console.log("No detailed models to log.");
  //   const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  //   console.log(`⏱️ Scraping completed in ${durationSeconds} seconds.`);
  // }

  // Single product
  const single = await getMobileResults(page, {
    competitor: "CEX",
    item: "iPhone 15 Pro Max",
    category: "smartphones and mobile",
    subcategory: "iPhone 15",
    attributes: { storage: "256GB" },
    broad: false,
  });

  console.log(single.results);

  await browser.close();
})();


