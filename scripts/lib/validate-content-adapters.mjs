import { existsSync } from "node:fs";
import { resolve } from "node:path";
export function validateContentAdapters(root, routes) {
	for (const relative of [
		routes.blog + "index.astro",
		routes.blog + "[...id].astro",
		routes.blog + "page/[page].astro",
		routes.tags + "index.astro",
		routes.tags + "[tag].astro",
		routes.search.slice(0, -1) + ".astro",
		routes.feed + ".ts",
	]) {
		if (!existsSync(resolve(root, "src/pages", relative)))
			throw new Error(
				"Content route has no matching Astro adapter: " +
					relative +
					". Route prefixes are fixed; rename the adapter before changing the contract.",
			);
	}
}
