import { siteConfig } from "@/config/site";
import { getAssetPath } from "@/lib/utils";

import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
	const manifest = {
		name: siteConfig.name,
		short_name: siteConfig.name,
		icons: [
			{
				src: getAssetPath("android-chrome-192x192.png"),
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: getAssetPath("android-chrome-512x512.png"),
				sizes: "512x512",
				type: "image/png",
			},
		],
		theme_color: siteConfig.themeColor.dark,
		background_color: siteConfig.themeColor.dark,
		display: "standalone",
	};

	return new Response(JSON.stringify(manifest), {
		headers: {
			"Content-Type": "application/manifest+json",
		},
	});
};
