import { setupPlaywright } from "./utils/playwright.js";
import { getMobileResults } from "./scrapers/mobileScraper.js";
import { getGameResults } from "./scrapers/gameScraper.js";
import { getConsoleResults } from "./scrapers/consoleScraper.js"; // ✅ import console scraper
import { uploadScrapeResultToDjango } from "./uploadToDjango.js";
import { scrapeConfigs, ScrapeConfig } from "./scrapeConfigs.js";
import util from "util";
import fs from "fs/promises";

const SCRAPE_OUTPUT_DIR = "./scrapeResults";

(async () => {
  const { browser } = await setupPlaywright(false); // headless true for nightly runs
  const startTime = Date.now();

  try {
    await fs.mkdir(SCRAPE_OUTPUT_DIR, { recursive: true });

    for (const config of scrapeConfigs) {
      console.log(`\n🚀 Starting scrape: ${config.type.toUpperCase()} - ${config.subcategory}`);

      try {
        let result;

        // ✅ Narrowing works automatically via discriminated union
        if (config.type === "game") {
          result = await getGameResults(browser, config);
        } else if (config.type === "mobile") {
          result = await getMobileResults(browser, config);
        } else if (config.type === "console") {
          result = await getConsoleResults(browser, config); // ✅ handle consoles
        } else {
          console.warn(`⚠️ Unknown scrape type: ${(config as ScrapeConfig).type}`);
          continue;
        }

        console.log(util.inspect(result, { depth: null, colors: true }));

        // ✅ Save results
        const filePath = `${SCRAPE_OUTPUT_DIR}/${config.name.replace(/\s+/g, "_")}.json`;
        await fs.writeFile(filePath, JSON.stringify(result, null, 2));

        // ✅ Read and upload
        const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
        await uploadScrapeResultToDjango(parsed, config.django);

        console.log(`✅ Uploaded ${config.name} to Django`);
      } catch (err) {
        console.error(`❌ Failed scrape for ${config.name}:`, err);
      }
    }
  } catch (err) {
    console.error("❌ Overall scrape runner failed:", err);
  } finally {
    await browser.close();
    console.log(`🕒 Finished all scrapes in ${(Date.now() - startTime) / 1000}s`);
  }
})();
