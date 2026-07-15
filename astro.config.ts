import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import robotsTxt from "astro-robots-txt";
import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";

import { siteConfig } from "./src/config/site";

// `site` and `base` must be known at config time, so they come from process/.env
// (astro:env is not available here). siteConfig provides the defaults.
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "PUBLIC_");

export default defineConfig({
	site: env.PUBLIC_SITE_URL || siteConfig.url,
	base: env.PUBLIC_BASE || siteConfig.base,
	trailingSlash: "always",
	integrations: [mdx(), react(), sitemap(), robotsTxt()],
	env: {
		schema: {
			PUBLIC_GTM_ID: envField.string({ context: "client", access: "public", optional: true }),
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
