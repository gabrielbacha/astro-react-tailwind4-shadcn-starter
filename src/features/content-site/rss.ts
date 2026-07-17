import rss from "@astrojs/rss";

import { siteConfig } from "@/config/site";

import { contentSiteConfig } from "./config";
import { getBlogPath, getPostPath, getVisiblePosts } from "./lib/content";

import type { APIContext } from "astro";

export async function createContentRss(context: APIContext) {
	const site = context.site ?? new URL(siteConfig.url);
	const posts = await getVisiblePosts();

	return rss({
		title: contentSiteConfig.feedTitle,
		description: contentSiteConfig.feedDescription,
		site: new URL(getBlogPath(), site),
		trailingSlash: true,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishedAt,
			link: getPostPath(post),
			categories: post.data.tags,
		})),
	});
}
