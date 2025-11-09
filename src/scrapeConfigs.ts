import type { MobileSearchOptions } from "./scrapers/mobileScraper.js";
import type { GameSearchOptions } from "./scrapers/gameScraper.js";
import type { ConsoleSearchOptions } from "./scrapers/consoleScraper.js";

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
  | (MobileSearchOptions & BaseScrapeConfig & { type: "mobile" })
  | (ConsoleSearchOptions & BaseScrapeConfig & { type: "console" });

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
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX Xbox Series Consoles",
    type: "console",
    competitor: "CEX",
    item: "Xbox Series",
    category: "consoles",
    subcategory: "Xbox Series Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Xbox Series Consoles",
    },
  },
  {
    name: "CEX Xbox One Consoles",
    type: "console",
    competitor: "CEX",
    item: "Xbox One",
    category: "consoles",
    subcategory: "Xbox One Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Xbox One Consoles",
    },
  },
  {
    name: "CEX Xbox Consoles",
    type: "console",
    competitor: "CEX",
    item: "Xbox",
    category: "consoles",
    subcategory: "Xbox Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Xbox Consoles",
    },
  },
  {
    name: "CEX Xbox 360 Consoles",
    type: "console",
    competitor: "CEX",
    item: "Xbox 360",
    category: "consoles",
    subcategory: "Xbox 360 Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Xbox 360 Consoles",
    },
  },
  {
    name: "CEX Playstation 4 Consoles",
    type: "console",
    competitor: "CEX",
    item: "Playstation 4",
    category: "consoles",
    subcategory: "Playstation4 Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Playstation4 Consoles",
    },
  },
  {
    name: "CEX Playstation 5 Consoles",
    type: "console",
    competitor: "CEX",
    item: "Playstation 5",
    category: "consoles",
    subcategory: "Playstation5 Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Playstation5 Consoles",
    },
  },
  {
    name: "CEX Switch Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "Switch Consoles",
    broad: false,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Switch Consoles",
    },
  },
];
