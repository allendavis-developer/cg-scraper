// competitors/cex.ts
import { CompetitorConfig, SearchParams } from './config';

export const cex: CompetitorConfig = {
  baseUrl: "https://uk.webuy.com",
  searchUrl: ({ item, category, subcategory, attributes }: SearchParams) => {
    let url = `https://uk.webuy.com/search?stext=${encodeURIComponent(item)}`;

    if (attributes?.storage) {
      url += `&Capacity=${encodeURIComponent(attributes.storage)}`;
    }

    if (category) {
      switch (category.toLowerCase()) {
        case "smartphones and mobile":
          url += "&superCatName=Phones&Grade=B";
          break;
        case "games (discs & cartridges)":
          url += "&superCatName=Gaming";
          break;
      }
    }

    return url;
  },
  selectors: {
    container: ".wrapper-box",
    title: ".content .card-title a",
    price: ".content .product-main-price",
    url: ".content .card-title a",
  }
};

// FOR BROAD SEARCHING through category friendly name 
export function cexMobileBroadSearchUrl(baseQuery: string, subcategory: string) {
  const baseUrl = "https://uk.webuy.com/search";
  return `${baseUrl}?stext=${encodeURIComponent(baseQuery)}&categoryFriendlyName=${encodeURIComponent(subcategory)}&Grade=B`;
}
