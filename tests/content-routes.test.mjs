import assert from "node:assert/strict";
import { test } from "node:test";

import { validateContentAdapters } from "../scripts/lib/validate-content-adapters.mjs";
import { validateContentRoutes, contentRoutes } from "../src/features/content-site/lib/route-contract.ts";
import { calendarDate, publicPath } from "../src/lib/shared/site-contract.ts";
test("fixed adapter contract matches emitted route filenames and rejects unsupported prefix changes", () => {
	validateContentAdapters(process.cwd(), contentRoutes);
	assert.throws(
		() => validateContentAdapters(process.cwd(), { ...contentRoutes, blog: "journal/" }),
		/no matching Astro adapter/,
	);
});
test("article/archive collision is detected before page generation", () => {
	const posts = Array.from({ length: 7 }, (_, n) => ({ id: "story-" + n }));
	posts[0].id = "page/2";
	assert.throws(() => validateContentRoutes(posts, ["sample"], 6), /collision/);
	for (const size of [0, -1, 1.5]) assert.throws(() => validateContentRoutes([], [], size));
});
test("portable path and calendar contract agrees with the news consumer", () => {
	assert.equal(publicPath("/news/", "blog/"), "/news/blog/");
	assert.equal(
		calendarDate(new Date("2026-07-14"), "en-US", { year: "numeric", month: "long", day: "numeric" }),
		"July 14, 2026",
	);
});
