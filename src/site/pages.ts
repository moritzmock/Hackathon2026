// The site's pages: their addresses, relative to where the site is served, and the one name each
// page goes by in links, tab titles and headings.
const base = import.meta.env.BASE_URL;

export const pages = {
  landing: `${base}index.html`,
  methods: `${base}methods.html`,
  runs: `${base}approaches.html`,
  city: `${base}city.html`,
};

export type PageKey = keyof typeof pages;

export const pageNames: Record<PageKey, string> = {
  landing: "Home",
  methods: "Methods",
  runs: "All runs",
  city: "City",
};

/** The city, opened on one building (the city reads `?building=`). */
export const cityAt = (buildingId: string) => `${pages.city}?building=${buildingId}`;
