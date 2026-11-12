import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import robotsTxt from "astro-robots-txt";
import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";

import { siteConfig } from "./src/config/site";
import { buildCutoff } from "./src/lib/shared/site-contract";

// `site` and `base` must be known at config time, so they come from process/.env
// (astro:env is not available here). siteConfig provides the defaults.
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "PUBLIC_");

import { validateContentAdapters } from "./scripts/lib/validate-content-adapters.mjs";
import { contentRoutes } from "./src/features/content-site/lib/route-contract";
validateContentAdapters(process.cwd(), contentRoutes);

export default defineConfig({
	site: env.PUBLIC_SITE_URL || siteConfig.url,
	base: env.PUBLIC_BASE || siteConfig.base,
	trailingSlash: "always",
	integrations: [mdx(), react(), sitemap(), robotsTxt()],
	markdown: {
		// Emit light and dark token colors as CSS variables so code blocks follow
		// the same pre-paint `.dark` theme used by the rest of the site.
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
			defaultColor: false,
			wrap: true,
		},
	},
	env: {
		schema: {
			PUBLIC_GTM_ID: envField.string({ context: "client", access: "public", optional: true }),
		},
	},
	vite: {
		plugins: [tailwindcss()],
		define: { "import.meta.env.PUBLICATION_CUTOFF": JSON.stringify(buildCutoff(process.env.ASTRO_PUBLICATION_CUTOFF)) },
	},
});
