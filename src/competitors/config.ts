export interface CompetitorConfig {
  baseUrl: string;
  searchUrl: (params: SearchParams) => string;
  selectors: {
    price: string;
    title: string;
    shop?: string;
    url: string;
    container: string;
  };
}

export interface SearchParams {
  item: string;
  model?: string;
  category?: string;
  subcategory?: string;
  attributes?: Record<string, string>;
}