import { CompetitorConfig, SearchParams } from './config';

const laptopCategoryMap = {
  "apple mac": "863",
  "chrome os": "1182",
  "other os": "1066",
  "windows": "1065",
} as const;

const tabletCategoryMap = {
  "ipad": "967",
  "android": "1027",
  "windows": "1026",
} as const;

const cameraCategoryMap = {
  "compact system": "985",
  "compact": "948",
  "digital slr": "950",
} as const;


const portableEntertainmentCategoryMap = {
  "apple": "1171",
  "headphones": "973",
} as const;

// Wearable Tech mapping
const wearableTechCategoryMap = {
  "smart watch": "1043",
  "smartwatch": "1043",
  "fitness tracker": "1043",
  "wearable": "1043",
} as const;




export const cex: CompetitorConfig = {
  baseUrl: "https://uk.webuy.com",
  searchUrl: ({ item, category, subcategory, attributes }: SearchParams) => {
    let url = `https://uk.webuy.com/search?stext=${encodeURIComponent(item)}`;
    if (subcategory) {
      const sub = subcategory.toLowerCase();

      // Handle laptops
      if (sub.includes("laptop")) {
        type LaptopKey = keyof typeof laptopCategoryMap;
        const matchedKey = (Object.keys(laptopCategoryMap) as LaptopKey[]).find((k) =>
          sub.includes(k)
        );
        const catId = matchedKey ? laptopCategoryMap[matchedKey] : "";
        url += `&categoryName=${encodeURIComponent(subcategory)}&categoryIds=${catId}`;
      }

      // Handle tablets
      else if (sub.includes("tablet")) {
        type TabletKey = keyof typeof tabletCategoryMap;
        const matchedKey = (Object.keys(tabletCategoryMap) as TabletKey[]).find((k) =>
          sub.includes(k)
        );
        const catId = matchedKey ? tabletCategoryMap[matchedKey] : "";
        url += `&categoryName=${encodeURIComponent(subcategory)}&categoryIds=${catId}`;
      }

      // Handle cameras
      else if (sub.includes("camera")) {
        type CameraKey = keyof typeof cameraCategoryMap;
        const matchedKey = (Object.keys(cameraCategoryMap) as CameraKey[]).find((k) =>
          sub.includes(k)
        );
        const catId = matchedKey ? cameraCategoryMap[matchedKey] : "";
        url += `&categoryName=${encodeURIComponent(subcategory)}&categoryIds=${catId}`;
      }

      // Handle portable entertainment
      else if (
        sub.includes("headphones") ||
        sub.includes("earphones") ||
        sub.includes("portable entertainment")
      ) {
        type PortableKey = keyof typeof portableEntertainmentCategoryMap;
        const matchedKey = (Object.keys(portableEntertainmentCategoryMap) as PortableKey[]).find((k) =>
          sub.includes(k)
        );
        const catId = matchedKey ? portableEntertainmentCategoryMap[matchedKey] : "";
        url += `&categoryName=${encodeURIComponent(subcategory)}&categoryIds=${catId}`;
      }

      // Everything else
      else {
        url += `&categoryFriendlyName=${encodeURIComponent(subcategory)}`;
      }
    }

    if (category) {
      switch (category.toLowerCase()) {
        case "smartphones and mobile":
          url += "&superCatName=Phones&Grade=B";
          if (attributes?.storage) {
            url += `&Capacity=${encodeURIComponent(attributes.storage)}`;
          }
          break;

        case "games (discs/cartridges)":
          url += "&superCatName=Gaming";
          break;

        // case "tablets":
        // case "watches":
        // case "portable entertainment":
        //   url += "&Grade=B";
        //   break;
      }
    }

    return url;
  },
  selectors: {
    container: ".search-product-card",
    title: ".content .card-title a",
    price: ".content .product-main-price",
    url: ".content .card-title a",
  },
};

