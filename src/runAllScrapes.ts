import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import util from "util";

const LOG_DIR = "./logs";
const LOG_FILE = path.join(LOG_DIR, "scrape-runner.log");

fs.mkdirSync(LOG_DIR, { recursive: true });

const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

const LEVELS: readonly ConsoleLevel[] = [
  "log",
  "info",
  "warn",
  "error",
  "debug",
] as const;

function formatArgs(args: readonly unknown[]): string {
  return args
    .map(arg =>
      typeof arg === "string"
        ? arg
        : util.inspect(arg, { depth: null, colors: false })
    )
    .join(" ");
}

function writeLog(level: string, args: readonly unknown[]): void {
  const timestamp = new Date().toISOString();
  logStream.write(
    `[${timestamp}] [${level}] ${formatArgs(args)}\n`
  );
}

LEVELS.forEach((level: ConsoleLevel): void => {
  const original: (...args: unknown[]) => void =
    console[level].bind(console);

  console[level] = (...args: unknown[]): void => {
    writeLog(level.toUpperCase(), args);

    // Optional: also output to terminal
    original(...args);
  };
});



import { setupPlaywright } from "./utils/playwright.js";
import { uploadScrapeResultToDjango } from "./uploadToDjango.js";
import { scrapeConfigs, ScrapeConfig } from "./scrapeConfigs.js";
import { getGenericItemResults } from "./scrapers/genericItemScraper.js";

const SCRAPE_OUTPUT_DIR = "./scrapeResults";

// Parse command line
const args = process.argv.slice(2);

const sendOnly = args.includes("--send");

// treat both `mobile` and `--mobile` as tags
const typeFilters = args
  .filter((a) => a !== "--send")
  .map((a) => a.replace(/^--/, "").toLowerCase());


const selectedConfigs =
  typeFilters.length === 0
    ? scrapeConfigs
    : scrapeConfigs.filter(
        (c) =>
          c.type &&
          typeFilters.includes(c.type.toLowerCase())
      );


(async () => {
  console.log(`${sendOnly ? "Sending" : "Running"} ${selectedConfigs.length} selected scrapes:`);
        selectedConfigs.forEach((c) => console.log(`  • ${c.name}`));

  if (!sendOnly) {
    // === Scraping mode ===
    const { browser, context } = await setupPlaywright(true); // headless
    const startTime = Date.now();

    try {
      await fsp.mkdir(SCRAPE_OUTPUT_DIR, { recursive: true });

      for (const config of selectedConfigs) {
        try {
          const result = await getGenericItemResults(context, config);

          // Save results only
          const filePath = path.join(SCRAPE_OUTPUT_DIR, `${config.name.replace(/\s+/g, "_")}.json`);
          await fsp.writeFile(filePath, JSON.stringify(result, null, 2));

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
        const exists = await fsp.stat(filePath).then(() => true).catch(() => false);

        if (!exists) {
          console.warn(`⚠️ File not found for ${config.name}, skipping upload`);
          continue;
        }

        const parsed = JSON.parse(await fsp.readFile(filePath, "utf8"));
        await uploadScrapeResultToDjango(parsed, config.django);
        console.log(`✅ Uploaded ${config.name} to Django`);
      } catch (err) {
        console.error(`❌ Failed to upload ${config.name}:`, err);
      }
    }
  }
})();
