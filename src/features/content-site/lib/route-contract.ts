import { encodeRouteSegments, routeRegistry, validatePageSize } from "../../../lib/shared/site-contract.ts";

/** Fixed route adapters under src/pages; rename adapters and this owner together. */
export const contentRoutes = Object.freeze({ blog: "blog/", tags: "tags/", search: "search/", feed: "rss.xml" });
export function validateContentRoutes(posts: Array<{ id: string }>, slugs: string[], pageSize: number) {
	const size = validatePageSize(pageSize),
		registry = routeRegistry();
	for (const path of Object.values(contentRoutes)) registry.add(path, "route adapter " + path);
	for (let page = 2; page <= Math.ceil(posts.length / size); page++)
		registry.add(contentRoutes.blog + "page/" + page, "blog archive");
	for (const post of posts) registry.add(contentRoutes.blog + encodeRouteSegments(post.id), "article " + post.id);
	for (const slug of slugs) registry.add(contentRoutes.tags + encodeRouteSegments(slug), "tag " + slug);
	return registry.paths;
}
