import type { MobileSearchOptions } from "./scrapers/mobileScraper.js";
import type { GameSearchOptions } from "./scrapers/gameScraper.js";
import type { ConsoleSearchOptions } from "./scrapers/consoleScraper.js";
import type { LaptopSearchOptions } from "./scrapers/laptopScraper.js";
import type { TabletSearchOptions } from "./scrapers/tabletScraper.js";
import type { TVSearchOptions } from "./scrapers/tvScraper.js";


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
  | (TVSearchOptions & BaseScrapeConfig & { type: "tv" });



export const scrapeConfigs: ScrapeConfig[] = [

  // // ------------------------------------- LAPTOPS -------------------------------------- 
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
    priceRanges : [
      [0, 54],
      [55, 59],
      [60, 64],
      [65, 69],
      [70, 74],
      [75, 79],
      [80, 84],
      [85, 89],
      [90, 94],
      [95, 99],
      [100, 104],
      [105, 109],
      [110, 114],
      [115, 119],
      [120, 124],
      [125, 129],
      [130, 134],
      [135, 139],
      [140, 144],
      [145, 149],
      [150, 154],
      [155, 159],
      [160, 164],
      [165, 169],
      [170, 174],
      [175, 179],
      [180, 184],
      [185, 189],
      [190, 194],
      [195, 199],
      [200, 209],
      [210, 219],
      [220, 229],
      [230, 239],
      [240, 249],
      [250, 259],
      [260, 269],
      [270, 279],
      [280, 289],
      [290, 299],
      [300, 319],
      [320, 339],
      [340, 359],
      [360, 379],
      [380, 399],
      [400, 449],
      [450, 499],
      [500, 599],
      [600, 699],
      [700, 799],
      [800, 899],
      [900, 999],
      [1000, 1200],
      [1200, 5000],
    ],
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

  // ------ PHONES ---------

  {
    name: "CEX Android Phones",
    type: "mobile",
    competitor: "CEX",
    item: "",
    category: "smartphones and mobile",
    subcategory: "Android Phones",
    broad: true,
    priceRanges: [
      [0, 4],
      [5, 9],
      [10, 14],
      [15, 19],
      [20, 24],
      [25, 29],
      [30, 34],
      [35, 39],
      [40, 44],
      [45, 49],
      [50, 54],
      [55, 59],
      [60, 64],
      [65, 69],
      [70, 74],
      [75, 79],
      [80, 84],
      [85, 89],
      [90, 94],
      [95, 99],
      [100, 104],
      [105, 109],
      [110, 114],
      [115, 119],
      [120, 124],
      [125, 129],
      [130, 134],
      [135, 139],
      [140, 144],
      [145, 149],
      [150, 154],
      [155, 159],
      [160, 164],
      [165, 169],
      [170, 174],
      [175, 179],
      [180, 184],
      [185, 189],
      [190, 194],
      [195, 199],
      [200, 209],
      [210, 219],
      [220, 229],
      [230, 239],
      [240, 249],
      [250, 259],
      [260, 269],
      [270, 279],
      [280, 289],
      [290, 299],
      [300, 319],
      [320, 339],
      [340, 359],
      [360, 379],
      [380, 399],
      [400, 449],
      [450, 499],
      [500, 599],
      [600, 699],
      [700, 799],
      [800, 899],
      [900, 999],
      [1000, 1200],
      [1200, 4000],
    ], // custom price ranges
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
  
];
