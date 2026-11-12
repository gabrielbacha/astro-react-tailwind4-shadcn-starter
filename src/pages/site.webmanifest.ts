import { siteConfig } from "@/config/site";
import { webManifest } from "@/lib/shared/site-contract";

import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
	new Response(JSON.stringify(webManifest(siteConfig, import.meta.env.BASE_URL)), {
		headers: { "Content-Type": "application/manifest+json" },
	});
