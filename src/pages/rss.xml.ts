import { createContentRss } from "@/features/content-site/rss";

import type { APIRoute } from "astro";

export const GET: APIRoute = createContentRss;
