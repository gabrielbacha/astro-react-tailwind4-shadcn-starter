import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";

import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import path from "path";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	site: "https://gabrielbacha.github.io",
	base: "/astro-react-tailwind4-shadcn-starter/",
	integrations: [mdx(), react(), sitemap(), icon(), robotsTxt()],
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
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
