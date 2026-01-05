// scrapers/cex.ts
import { Page } from "playwright";
import { parsePrice } from "../utils";

export interface CEXProduct {
  competitor: "CEX";
  id: string | null;
  title: string;
  price: number | null;
  url: string | null;
  tradeVoucher?: number | null;
  tradeCash?: number | null;
}

async function handleCMP(page: Page) {
  try {
    console.log("🧹 Waiting for and removing CEX cookie overlay...");

    // Wait longer for the CMP to potentially appear and load
    await page.waitForTimeout(2500);

    // Keep trying until the overlay is truly gone
    for (let attempt = 0; attempt < 5; attempt++) {
      const overlayStatus = await page.evaluate(() => {
        let removed = false;
        
        // Remove CMP wrapper
        const cmp = document.querySelector('#cmpwrapper');
        if (cmp) {
          console.log('💣 Removing #cmpwrapper overlay');
          cmp.remove();
          removed = true;
        }
        
        // Remove backdrop
        const backdrop = document.querySelector('.cmpbox');
        if (backdrop) {
          backdrop.remove();
          removed = true;
        }

        // Remove any iframes that might contain the consent form
        const iframes = document.querySelectorAll('iframe[src*="cmp"], iframe[id*="cmp"]');
        iframes.forEach(iframe => {
          iframe.remove();
          removed = true;
        });

        // Force body to be interactive
        document.body.style.overflow = 'auto';
        document.body.style.pointerEvents = 'auto';

        // Check if cmpwrapper still exists (even if empty)
        const stillExists = !!document.querySelector('#cmpwrapper');
        
        return { removed, stillExists };
      });

      if (overlayStatus.removed) {
        console.log(`🗑️  Removed overlay elements on attempt ${attempt + 1}`);
      }

      if (!overlayStatus.stillExists) {
        console.log(`✅ CMP overlay confirmed gone after attempt ${attempt + 1}`);
        break;
      } else {
        console.log(`⏳ CMP wrapper still exists, waiting... (attempt ${attempt + 1}/5)`);
        await page.waitForTimeout(500);
      }
    }

    // Final nuclear option: verify nothing is blocking interactions
    await page.waitForTimeout(500);
    const finalCheck = await page.evaluate(() => {
      const cmp = document.querySelector('#cmpwrapper');
      return { exists: !!cmp, hasContent: cmp ? cmp.innerHTML.length > 0 : false };
    });

    if (finalCheck.exists) {
      console.warn(`⚠️ #cmpwrapper still exists (${finalCheck.hasContent ? 'with content' : 'empty'}), force-removing...`);
      await page.evaluate(() => {
        document.querySelectorAll('#cmpwrapper, .cmpbox').forEach(el => el.remove());
        document.body.style.overflow = 'auto';
        document.body.style.pointerEvents = 'auto';
      });
      await page.waitForTimeout(1000);
    }

    console.log("✅ CMP overlay handling complete.");
  } catch (err) {
    console.warn("⚠️ CMP overlay handler failed:", err);
  }
}

export async function scrapeCEX(
  page: Page,
  containerSelector: string,
  titleSelector: string,
  priceSelector: string,
  urlSelector: string
): Promise<CEXProduct[]> {

  const BASE_URL = "https://uk.webuy.com";

  // Wait for cards to exist (no stabilization loop)
  await page.waitForSelector(containerSelector, { timeout: 10000 });

  return page.evaluate(
    ({ containerSelector, titleSelector, priceSelector, urlSelector, BASE_URL }) => {
      const parsePrice = (text: string | null): number | null => {
        if (!text) return null;
        const num = text.replace(/[^\d.]/g, "");
        return num ? Number(num) : null;
      };

      return Array.from(document.querySelectorAll(containerSelector)).map(card => {
        const titleEl = card.querySelector(titleSelector);
        const priceEl = card.querySelector(priceSelector);
        const urlEl = card.querySelector(urlSelector);

        const title = titleEl?.textContent?.trim() ?? "";
        const price = parsePrice(priceEl?.textContent ?? null);

        const relativeUrl = urlEl?.getAttribute("href") ?? null;
        const url = relativeUrl
          ? relativeUrl.startsWith("http")
            ? relativeUrl
            : new URL(relativeUrl, BASE_URL).href
          : null;

        let id: string | null = null;
        if (url) {
          const match = url.match(/[?&]id=([^&]+)/);
          if (match) id = decodeURIComponent(match[1]);
        }

        return {
          competitor: "CEX" as const,
          id,
          title,
          price,
          url,
        };
      });
    },
    { containerSelector, titleSelector, priceSelector, urlSelector, BASE_URL }
  );
}


/**
 * OLD Scrape CEX search results from a page THAT HAS THE TRADE IN TOGGLE, 
 * rn we can derive the trade in cash prices dynamically using cex's api, 
 * until the cex's api stops working we dont need to run handlecmp and toggle the trade in 
 * this will save a bunch of time 
 * cuz for some reason i cant run scraping in parallel anymore cause cloudflare blocks so time is paramount
 */
// export async function scrapeCEX(page: Page, containerSelector: string, titleSelector: string, priceSelector: string, urlSelector: string): Promise<CEXProduct[]> {
//   const results: CEXProduct[] = [];
//   const BASE_URL = "https://uk.webuy.com";
//   // // 🧹 Remove or dismiss the cookie consent overlay
//   // await handleCMP(page);

//   // Wait for the main container to load
//   await page.waitForSelector(containerSelector, { state: "attached", timeout: 10000 });

//    // Wait for the number of cards to stabilize
//     await page.waitForFunction(
//       (sel) => {
//         const counts: number[] = (window as any)._cardCounts || [];
//         const current = document.querySelectorAll(sel).length;
//         counts.push(current);
//         (window as any)._cardCounts = counts.slice(-5);
//         // Check if the last few counts are identical (stable)
//         return counts.length >= 3 && counts.every((n) => n === counts[0]);
//       },
//       containerSelector,
//       { timeout: 10000 }
//     );

//   // // Turn on the Trade-in toggle (shows voucher & cash)
//   // const tradeInToggleInput = await page.$('div.toggle-switch input[type="checkbox"]');
//   // if (tradeInToggleInput) {
//   //   const isChecked = await tradeInToggleInput.isChecked(); // true if toggle is already on

//   //   if (!isChecked) {
//   //     console.log("🟢 Enabling trade-in toggle...");
//   //     const slider = await page.$('div.toggle-switch label.cx-switch-button span.slider');
//   //     if (slider) {
//   //       await slider.click();
//   //       await page.waitForTimeout(500); // wait for UI to update
//   //     }
//   //   } else {
//   //     console.log("✅ Trade-in toggle already enabled.");
//   //   }
//   // }


//   // Get all product cards
//   const cards = await page.$$(containerSelector);
//   for (const card of cards) {
//     try {
//       const titleEl = await card.$(titleSelector);
//       const priceEl = await card.$(priceSelector);
//       const urlEl = await card.$(urlSelector);
//       const gradeEl = await card.$(".grade-letter");

//       if (!titleEl || !priceEl) continue;

//       const title = (await titleEl.innerText()).trim();
//       const priceText = (await priceEl.innerText()).trim();
//       const price = parsePrice(priceText);
//       const relativeUrl = urlEl ? await urlEl.getAttribute("href") : null;
//       // const grade = gradeEl ? (await gradeEl.innerText()).trim() : null;

//       // Make URL absolute
//       const url = relativeUrl
//         ? relativeUrl.startsWith("http")
//           ? relativeUrl
//           : new URL(relativeUrl, BASE_URL).href
//         : null;

        
//       //   // Trade-in values
//       // const voucherEl = await card.$('.tradeInPrices p:first-child span');
//       // const cashEl = await card.$('.tradeInPrices p:nth-child(2) span');
//       // const tradeVoucher = voucherEl ? parsePrice(await voucherEl.innerText()) : null;
//       // const tradeCash = cashEl ? parsePrice(await cashEl.innerText()) : null;


//       // Extract ID from URL query param `id`
//       let id: string | null = null;
//       if (url) {
//         const match = url.match(/[?&]id=([^&]+)/);
//         if (match) id = decodeURIComponent(match[1]);
//       }

//       // results.push({ competitor: "CEX", id, title, price, url, tradeVoucher, tradeCash });
//       results.push({ competitor: "CEX", id, title, price, url });

//     } catch (err) {
//       console.error("Error parsing CEX card:", err);
//     }
//   }

//   return results;
// }