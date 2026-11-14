// The addresses of the site's pages, relative to where the site is served.
const base = import.meta.env.BASE_URL;

export const pages = {
  landing: `${base}index.html`,
  methods: `${base}methods.html`,
  runs: `${base}approaches.html`,
  city: `${base}city.html`,
};
