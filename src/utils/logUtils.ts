import fs from "fs";
import path from "path";

export interface LoggableVariant {
  key: string;
  rawTitles?: string[];
}

export function logScrapePlan(variants: LoggableVariant[], startTime: number) {
  const lines: string[] = ["📝 Scrape Plan:"];

  for (const variant of variants) {
    lines.push(`- ${variant.key}`);
  }

  const output = lines.join("\n");

  const filePath = path.join(process.cwd(), "scrape-plan.txt");
  fs.writeFileSync(filePath, output, { encoding: "utf-8" });

  console.log(output);

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ Scraping completed in ${durationSeconds} seconds.`);
}
