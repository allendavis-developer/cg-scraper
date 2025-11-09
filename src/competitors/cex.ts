// competitors/cex.ts
import { CompetitorConfig, SearchParams } from './config';

export const cex: CompetitorConfig = {
  baseUrl: "https://uk.webuy.com",
  searchUrl: ({ item, category, subcategory, attributes }: SearchParams) => {
    let url = `https://uk.webuy.com/search?stext=${encodeURIComponent(item)}`;

    if (subcategory) {
      url += `&categoryFriendlyName=${encodeURIComponent(subcategory)}`;
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
