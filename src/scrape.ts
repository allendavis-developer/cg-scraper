// main.ts
import { setupPlaywright } from "./utils/playwright";
import { getMobileResults } from "./utils/getMobileResults";

(async () => {
  const { browser, page } = await setupPlaywright(true);

  // // Single product
  // const single = await getResults(page, {
  //   competitor: "CEX",
  //   item: "iPhone 15 Pro Max",
  //   category: "smartphones and mobile",
  //   attributes: { storage: "256GB" },
  //   broad: false,
  // });

  // console.log("Single product results:");
  // console.log(single.results);

  // Broad scrape
  const broad = await getMobileResults(page, {
    competitor: "CEX",
    item: "iPhone",
    category: "smartphones and mobile",
    subcategory: "Legacy iPhones",
    broad: true,
  });

  console.log("Broad results:");
  console.log(broad.models);

  await browser.close();
})();
