// Step 1: Install packages

// utils/playwright.ts
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import { Browser, Page, BrowserContext } from "playwright";

// Add the stealth plugin to chromium
chromium.use(stealth());

export async function setupPlaywright(headless = true): Promise<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}> {
  const browser = await chromium.launch({
    headless,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  });

  const page = await context.newPage();

  return { browser, context, page };
}