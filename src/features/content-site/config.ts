import { siteConfig } from "@/config/site";

import { contentRoutes } from "./lib/route-contract";

export const contentSiteConfig = {
	collection: "blog" as const,
	pageSize: 6,
	feedTitle: `${siteConfig.name} Journal`,
	feedDescription: `Writing, notes, and updates from ${siteConfig.name}.`,
	routes: contentRoutes,
} as const;
