// utils/playwright.ts
import { chromium, Browser, Page, BrowserContext } from "playwright";

export async function setupPlaywright(headless = true): Promise<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}> {
  const browser = await chromium.launch({ headless });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
  });

  const page = await context.newPage();

  return { browser, context, page };
}
