import { contentSiteConfig } from "../config";
import { getTagGroups, getVisiblePosts } from "./content";

import type { GetStaticPaths } from "astro";

export const getBlogPaginationPaths: GetStaticPaths = async ({ paginate }) => {
	const pages = paginate(await getVisiblePosts(), { pageSize: contentSiteConfig.pageSize });
	return pages.filter(({ params }) => params.page !== "1");
};

export const getBlogPostPaths: GetStaticPaths = async () => {
	return (await getVisiblePosts()).map((post) => ({
		params: { id: post.id },
		props: { post },
	}));
};

export const getTagPaths: GetStaticPaths = async () => {
	return (await getTagGroups()).map((group) => ({
		params: { tag: group.slug },
		props: { group },
	}));
};
