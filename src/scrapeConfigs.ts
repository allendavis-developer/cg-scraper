import type { MobileSearchOptions } from "./scrapers/mobileScraper.js";
import type { GameSearchOptions } from "./scrapers/gameScraper.js";

interface DjangoUploadMeta {
  categoryName: string;
  subcategoryName: string;
}

interface BaseScrapeConfig {
  name: string;
  django: DjangoUploadMeta;
}

export type ScrapeConfig =
  | (GameSearchOptions & BaseScrapeConfig & { type: "game" })
  | (MobileSearchOptions & BaseScrapeConfig & { type: "mobile" });

export const scrapeConfigs: ScrapeConfig[] = [
  {
    name: "CEX Switch Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Switch Games",
    broad: false,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Switch Games",
    },
  },
  {
    name: "CEX iPhone 14",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 14",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone 14",
    },
  },
];
