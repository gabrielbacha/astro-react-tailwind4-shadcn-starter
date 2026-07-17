import { siteConfig } from "@/config/site";

export const contentSiteConfig = {
	collection: "blog" as const,
	pageSize: 6,
	feedTitle: `${siteConfig.name} Journal`,
	feedDescription: `Writing, notes, and updates from ${siteConfig.name}.`,
	routes: {
		blog: "blog/",
		tags: "tags/",
		search: "search/",
		feed: "rss.xml",
	},
} as const;
