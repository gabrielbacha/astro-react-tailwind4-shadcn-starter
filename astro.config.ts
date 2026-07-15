import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";

import { siteConfig } from "./src/config/site";

export default defineConfig({
	site: siteConfig.url,
	base: siteConfig.base,
	trailingSlash: "always",
	integrations: [mdx(), react(), sitemap(), robotsTxt()],
	vite: {
		plugins: [tailwindcss()],
	},
});
