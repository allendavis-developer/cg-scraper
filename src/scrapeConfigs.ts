import type { MobileSearchOptions } from "./scrapers/mobileScraper.js";
import type { GameSearchOptions } from "./scrapers/gameScraper.js";
import type { ConsoleSearchOptions } from "./scrapers/consoleScraper.js";
import type { LaptopSearchOptions } from "./scrapers/laptopScraper.js";
import type { TabletSearchOptions } from "./scrapers/tabletScraper.js";
import type { TVSearchOptions } from "./scrapers/tvScraper.js";
import type { WatchSearchOptions } from "./scrapers/watchScraper.js";
import type { HeadphoneSearchOptions } from "./scrapers/earpodsHeadphonesScraper.js";
import type { SpeakerSearchOptions } from "./scrapers/bluetoothSpeakerScraper.js";


import { getGenericItemResults, type GenericItemSearchOptions } from "./scrapers/genericItemScraper.js";



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
  | (ConsoleSearchOptions & BaseScrapeConfig & { type: "console" })
  
  | (LaptopSearchOptions & BaseScrapeConfig & { type: "laptop" })
  | (TabletSearchOptions & BaseScrapeConfig & { type: "tablet" })
  | (TVSearchOptions & BaseScrapeConfig & { type: "tv" })
  | (WatchSearchOptions & BaseScrapeConfig & { type: "watch" })
  | (HeadphoneSearchOptions & BaseScrapeConfig & { type: "headphone" })
  | (SpeakerSearchOptions & BaseScrapeConfig & { type: "speaker" })
  | (GenericItemSearchOptions & BaseScrapeConfig & { type: "generic" });




export const scrapeConfigs: ScrapeConfig[] = [

  //------------------------------------- LAPTOPS -------------------------------------- 
  {
    name: "CEX Macbooks",
    type: "laptop",
    competitor: "CEX",
    item: "",
    category: "laptops",
    subcategory: "Laptops - Apple Mac",
    broad: true,
    django: {
      categoryName: "Laptops",
      subcategoryName: "Macbooks",
    },
  }, 
  {
    name: "CEX Windows Laptops",
    type: "laptop",
    competitor: "CEX",
    item: "",
    category: "laptops",
    subcategory: "Laptops - Windows",
    broad: true,
    django: {
      categoryName: "Laptops",
      subcategoryName: "Windows Laptops",
    },
  }, 
  {
    name: "CEX Laptops Other OS",
    type: "laptop",
    competitor: "CEX",
    item: "",
    category: "laptops",
    subcategory: "Laptops - Other OS",
    broad: true,
    django: {
      categoryName: "Laptops",
      subcategoryName: "Other OS",
    },
  }, 
  {
    name: "CEX Chromebooks",
    type: "laptop",
    competitor: "CEX",
    item: "",
    category: "laptops",
    subcategory: "Laptops - Chrome OS",
    broad: true,
    django: {
      categoryName: "Laptops",
      subcategoryName: "Chromebooks",
    },
  }, 


  // ----------------------------------- HEADPHONES -------------------------------------
  {
    name: "CEX Headphones",
    type: "headphone",
    competitor: "CEX",
    item: "",
    category: "headphones",
    subcategory: "Headphones",
    broad: true,
    django: {
      categoryName: "Headphones",
      subcategoryName: "Normal Headphones",
    },
  }, 

  {
    name: "CEX Apple Headphones",
    type: "headphone",
    competitor: "CEX",
    item: "",
    category: "headphones",
    subcategory: "Headphones - Apple",
    broad: true,
    django: {
      categoryName: "Headphones",
      subcategoryName: "Apple Headphones",
    },
  }, 

  
  // ----------------------------------- MEDIA PLAYERS -------------------------------------
  {
    name: "CEX Speakers",
    type: "speaker",
    competitor: "CEX",
    item: "bluetooth speaker",
    category: "bluetooth speaker",
    subcategory: "Media Player Accessories",
    broad: true,
    django: {
      categoryName: "Media Players",
      subcategoryName: "Bluetooth Speakers",
    },
  }, 


  // ------------------------------------- TABLETS ---------------------------------------
  {
    name: "CEX iPads",
    type: "tablet",
    competitor: "CEX",
    item: "",
    category: "tablets",
    subcategory: "Apple iPad",
    broad: true,
    django: {
      categoryName: "Tablets",
      subcategoryName: "Apple iPad",
    },
  }, 
  {
    name: "CEX Windows Tablets",
    type: "tablet",
    competitor: "CEX",
    item: "",
    category: "tablets",
    subcategory: "Tablets - Windows",
    broad: true,
    django: {
      categoryName: "Tablets",
      subcategoryName: "Windows Tablets",
    },
  }, 
  {
    name: "CEX Android Tablets",
    type: "tablet",
    competitor: "CEX",
    item: "",
    category: "tablets",
    subcategory: "Tablets - Android",
    broad: true,
    django: {
      categoryName: "Tablets",
      subcategoryName: "Android Tablets",
    },
  }, 

  // -------------------------------------- TV's ------------------------------------------
  {
    name: "CEX LCD TV's",
    type: "tv",
    competitor: "CEX",
    item: "",
    category: "tv",
    subcategory: "LCD Televisions",
    broad: true,
    django: {
      categoryName: "Televisions",
      subcategoryName: "LCD Television",
    },
  }, 

  {
    name: "CEX LED TV's",
    type: "tv",
    competitor: "CEX",
    item: "",
    category: "tv",
    subcategory: "LED Televisions",
    broad: true,
    django: {
      categoryName: "Televisions",
      subcategoryName: "LED Television",
    },
  }, 

  // ------------------------------------ CAMERAS ----------------------------------------
  {
    name: "CEX Cameras Compact System",
    type: "generic",
    competitor: "CEX",
    item: "",
    category: "cameras",
    subcategory: "Cameras - Compact System",
    broad: true,
    django: {
      categoryName: "Cameras",
      subcategoryName: "Cameras - Compact System",
    },
  }, 

  {
    name: "CEX Cameras Compact Cameras",
    type: "generic",
    competitor: "CEX",
    item: "",
    category: "cameras",
    subcategory: "Cameras - Compact Cameras",
    broad: true,
    django: {
      categoryName: "Cameras",
      subcategoryName: "Cameras - Compact Cameras",
    },
  }, 

  {
    name: "CEX Cameras Digital SLR Cameras",
    type: "generic",
    competitor: "CEX",
    item: "",
    category: "cameras",
    subcategory: "Cameras - Digital SLR Cameras",
    broad: true,
    django: {
      categoryName: "Cameras",
      subcategoryName: "Cameras - Digital SLR Cameras",
    },
  }, 

  // ---------------------------------- MUSIC TECH ---------------------------------------
    {
    name: "CEX DJ Decks and Mixers",
    type: "generic",
    competitor: "CEX",
    item: "",
    category: "cameras",
    subcategory: "DJ Decks and Mixers",
    broad: true,
    django: {
      categoryName: "Music Tech",
      subcategoryName: "DJ Decks and Mixers",
    },
  }, 

  // ---------------------------------- VR HEADSETS -----------------------------------------
   {
    name: "CEX VR Headsets",
    type: "generic",
    competitor: "CEX",
    item: "",
    category: "cameras",
    subcategory: "VR Tech",
    broad: true,
    django: {
      categoryName: "Wearable Tech",
      subcategoryName: "VR Tech",
    },
  }, 


  // ------------------------------------ WATCHES ----------------------------------------
  {
    name: "CEX Smartwatches",
    type: "watch",
    competitor: "CEX",
    item: "",
    category: "watches",
    subcategory: "Smartwatches",
    broad: true,
    django: {
      categoryName: "Smartwatches",
      subcategoryName: "Smartwatches",
    },
  }, 

  {
    name: "CEX Apple Watches",
    type: "watch",
    competitor: "CEX",
    item: "",
    category: "watches",
    subcategory: "Apple Watch",
    broad: true,
    django: {
      categoryName: "Smartwatches",
      subcategoryName: "Apple Watch",
    },
  }, 


  // -------------------------------------- GAMES ------------------------------------------
  {
    name: "CEX Switch Games",
    type: "game", 
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Switch Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Switch Games",
    },
  },
  {
    name: "CEX PS4 Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Playstation4 Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Playstation4 Games",
    },
  },
    {
    name: "CEX PS5 Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Playstation5 Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Playstation5 Games",
    },
  },
    {
    name: "CEX Xbox Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Xbox Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Xbox Games",
    },
  },
  {
    name: "CEX Xbox One Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Xbox One Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Xbox One Games",
    },
  },

  {
    name: "CEX Xbox Series Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Xbox Series Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Xbox Series Games",
    },
  },

  {
    name: "CEX Xbox 360 Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Xbox 360 Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Xbox 360 Games",
    },
  },

  {
    name: "CEX Xbox 360 Rarities",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Xbox 360 Rarities",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Xbox 360 Games",
    },
  },

  {
    name: "CEX PS Vita Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "PS Vita Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "PS Vita Games",
    },
  },


  {
    name: "CEX PSP Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "PSP Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "PSP Games",
    },
  },

  {
    name: "CEX Wii Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Wii Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Wii Games",
    },
  },

  {
    name: "CEX Wii U Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Wii U Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Wii U Games",
    },
  },

  {
    name: "CEX Switch 2 Games",
    type: "game",
    competitor: "CEX",
    item: "",
    category: "games (discs/cartridges)",
    subcategory: "Switch 2 Games",
    broad: true,
    django: {
      categoryName: "Games (Discs/Cartridges)",
      subcategoryName: "Switch 2 Games",
    },
  },



  // ------ PHONES ---------

  {
    name: "CEX Android Phones",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "Android Phones",
    broad: true,
      django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "Android Phones",
    },
  },
  {
    name: "CEX iPhone 11",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 11",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

    {
    name: "CEX iPhone 12",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 12",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

    {
    name: "CEX iPhone 13",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 13",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
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
    name: "CEX iPhone 15",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 15",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX iPhone 16",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 16",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX iPhone 17",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone 17",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX iPhone Air",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone Air",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX iPhone SE",
    type: "mobile",
    competitor: "CEX",
    item: "iPhone SE",
    category: "smartphones and mobile",
    subcategory: "Legacy iPhones",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX iPhone SE (2nd Generation)",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone SE (2nd Generation)",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  {
    name: "CEX iPhone SE (3rd Generation)",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "iPhone SE (3rd Generation)",
    broad: true,
    django: {
      categoryName: "Smartphones and Mobile",
      subcategoryName: "iPhone",
    },
  },

  // ------------- CONSOLE ACCESSORIES ----------------
  {
    name: "CEX Playstation Portal",
    type: "console",
    competitor: "CEX",
    item: "Playstation Portal Remote Player",
    category: "consoles",
    subcategory: "",
    broad: false,
    django: {
      categoryName: "Console Accessories",
      subcategoryName: "Playstation Portal",
    },
  },
  // -------------------- CONSOLES -------------
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
    name: "CEX Playstation 2 Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "Playstation2 Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Playstation2 Consoles",
    },
  },
    {
    name: "CEX Playstation 3 Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "Playstation3 Consoles",
    broad: true,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Playstation3 Consoles",
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
  {
    name: "CEX Switch 2 Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "Switch 2 Consoles",
    broad: false,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Switch Consoles",
    },
  },
  {
    name: "CEX DS Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "3DS Consoles", // in cex the 2ds and 3ds are both stored under 3ds consoles
    broad: false,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "DS Consoles",
    },
  },
    {
    name: "CEX Wii Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "Wii Consoles", // in cex the 2ds and 3ds are both stored under 3ds consoles
    broad: false,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Wii Consoles",
    },
  },
  {
    name: "CEX Wii U Consoles",
    type: "console",
    competitor: "CEX",
    item: "",
    category: "consoles",
    subcategory: "Wii U Consoles", // in cex the 2ds and 3ds are both stored under 3ds consoles
    broad: false,
    django: {
      categoryName: "Gaming Consoles",
      subcategoryName: "Wii U Consoles",
    },
  },
  
];
