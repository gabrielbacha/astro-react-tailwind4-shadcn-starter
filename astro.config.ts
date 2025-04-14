import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	site: import.meta.env.MODE === "production" ? "https://gabrielbacha.github.io/astro-react-tailwind4-shadcn-starter/" : "http://localhost:4321",
	base: import.meta.env.MODE === "production" ? "/astro-react-tailwind4-shadcn-starter/" : "/",
	integrations: [mdx(), react(), sitemap(), icon()],
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
