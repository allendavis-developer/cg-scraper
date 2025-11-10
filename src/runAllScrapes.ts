import { setupPlaywright } from "./utils/playwright.js";
import { getMobileResults } from "./scrapers/mobileScraper.js";
import { getGameResults } from "./scrapers/gameScraper.js";
import { getConsoleResults } from "./scrapers/consoleScraper.js";
import { uploadScrapeResultToDjango } from "./uploadToDjango.js";
import { scrapeConfigs, ScrapeConfig } from "./scrapeConfigs.js";
import util from "util";
import fs from "fs/promises";
import path from "path";

const SCRAPE_OUTPUT_DIR = "./scrapeResults";

// Parse command line
const args = process.argv.slice(2);
const sendOnly = args.includes("--send"); // Only upload
const filters = args.filter(a => a !== "--send" && a !== "--").map(a => a.toLowerCase());

const selectedConfigs =
  filters.length === 0
    ? scrapeConfigs
    : scrapeConfigs.filter(
        (c) =>
          filters.includes(c.type.toLowerCase()) ||
          filters.some((f) => c.name.toLowerCase().includes(f))
      );

console.log(`${sendOnly ? "Sending" : "Running"} ${selectedConfigs.length} selected scrapes:`);
selectedConfigs.forEach((c) => console.log(`  • ${c.name}`));

(async () => {
  if (!sendOnly) {
    // === Scraping mode ===
    const { browser } = await setupPlaywright(true); // headless
    const startTime = Date.now();

    try {
      await fs.mkdir(SCRAPE_OUTPUT_DIR, { recursive: true });

      for (const config of selectedConfigs) {
        console.log(`\n🚀 Starting scrape: ${config.type.toUpperCase()} - ${config.subcategory}`);

        try {
          let result;

          if (config.type === "game") result = await getGameResults(browser, config);
          else if (config.type === "mobile") result = await getMobileResults(browser, config);
          else if (config.type === "console") result = await getConsoleResults(browser, config);
          else {
            console.warn(`⚠️ Unknown scrape type: ${(config as ScrapeConfig).type}`);
            continue;
          }

          console.log(util.inspect(result, { depth: null, colors: true }));

          // Save results only
          const filePath = path.join(SCRAPE_OUTPUT_DIR, `${config.name.replace(/\s+/g, "_")}.json`);
          await fs.writeFile(filePath, JSON.stringify(result, null, 2));

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
  } else {
    // === Send/upload mode ===
    for (const config of selectedConfigs) {
      try {
        const filePath = path.join(SCRAPE_OUTPUT_DIR, `${config.name.replace(/\s+/g, "_")}.json`);
        const exists = await fs.stat(filePath).then(() => true).catch(() => false);

        if (!exists) {
          console.warn(`⚠️ File not found for ${config.name}, skipping upload`);
          continue;
        }

        const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
        await uploadScrapeResultToDjango(parsed, config.django);
        console.log(`✅ Uploaded ${config.name} to Django`);
      } catch (err) {
        console.error(`❌ Failed to upload ${config.name}:`, err);
      }
    }
  }
})();
