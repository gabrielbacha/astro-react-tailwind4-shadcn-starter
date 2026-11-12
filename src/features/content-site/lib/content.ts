import { getCollection, type CollectionEntry } from "astro:content";

import { siteConfig } from "@/config/site";
import { calendarDate, tagSlug } from "@/lib/shared/site-contract";
import { getAssetPath } from "@/lib/utils";

import { contentSiteConfig } from "../config";
import { validateContentRoutes } from "./route-contract";

export type BlogEntry = CollectionEntry<"blog">;

export interface TagGroup {
	name: string;
	slug: string;
	posts: BlogEntry[];
}

function encodePathSegments(path: string) {
	return path
		.split("/")
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join("/");
}

export function getBlogPath(page = 1) {
	return getAssetPath(page === 1 ? contentSiteConfig.routes.blog : `${contentSiteConfig.routes.blog}page/${page}/`);
}

export function getPostPath(post: Pick<BlogEntry, "id">) {
	return getAssetPath(`${contentSiteConfig.routes.blog}${encodePathSegments(post.id)}/`);
}

export function getTagsPath() {
	return getAssetPath(contentSiteConfig.routes.tags);
}

export function getTagPath(slug: string) {
	return getAssetPath(`${contentSiteConfig.routes.tags}${encodeURIComponent(slug)}/`);
}

export function getSearchPath() {
	return getAssetPath(contentSiteConfig.routes.search);
}

export function getFeedPath() {
	return getAssetPath(contentSiteConfig.routes.feed);
}

export function formatPostDate(date: Date) {
	return calendarDate(date, siteConfig.language, { day: "2-digit", month: "short", year: "numeric" });
}

export function getReadingTime(post: BlogEntry) {
	const text = (post.body ?? "")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/[#>*_`[\](){}|-]/g, " ");
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 220));
}

export function slugifyTag(tag: string) {
	return tagSlug(tag);
}
let visibleSnapshot: Promise<BlogEntry[]> | undefined;
const publicationCutoff = new Date(import.meta.env.PUBLICATION_CUTOFF);
export function getVisiblePosts() {
	if (!visibleSnapshot)
		visibleSnapshot = (async () => {
			const posts = await getCollection(
				contentSiteConfig.collection,
				({ data }) => !import.meta.env.PROD || (!data.draft && data.publishedAt <= publicationCutoff),
			);
			const sorted = posts.toSorted(
				(left, right) =>
					right.data.publishedAt.getTime() - left.data.publishedAt.getTime() || left.id.localeCompare(right.id),
			);
			validateContentRoutes(
				sorted,
				createTagGroups(sorted).map((group) => group.slug),
				contentSiteConfig.pageSize,
			);
			return sorted;
		})();
	return visibleSnapshot;
}

export function createTagGroups(posts: BlogEntry[]) {
	const groups = new Map<string, TagGroup & { canonicalName: string }>();

	for (const post of posts) {
		for (const tag of post.data.tags) {
			const name = tag.trim();
			const canonicalName = name.toLocaleLowerCase();
			const slug = slugifyTag(name);
			const existing = groups.get(slug);

			if (existing && existing.canonicalName !== canonicalName) {
				throw new Error(`Tags "${existing.name}" and "${name}" both resolve to /tags/${slug}/. Rename one of them.`);
			}

			if (existing) {
				existing.posts.push(post);
			} else {
				groups.set(slug, { name, canonicalName, slug, posts: [post] });
			}
		}
	}

	return [...groups.values()]
		.map(({ canonicalName: _canonicalName, ...group }) => group)
		.toSorted((left, right) => left.name.localeCompare(right.name, siteConfig.language));
}

export async function getTagGroups() {
	return createTagGroups(await getVisiblePosts());
}
