import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://example.com",
	integrations: [mdx(), react(), sitemap(), icon(), robotsTxt()],
	vite: {
		plugins: [tailwindcss()],
	},
	server: {
		host: true,
	},
	devToolbar: {
		enabled: false,
	},
	markdown: {
		syntaxHighlight: false,
	},
});
