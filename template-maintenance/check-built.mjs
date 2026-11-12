import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
const root = resolve(process.env.ASTRO_TEST_DIST ?? "dist");
const manifest = JSON.parse(await readFile(join(root, "site.webmanifest"), "utf8"));
const base = manifest.scope;
if (
	typeof base !== "string" ||
	!base.startsWith("/") ||
	!base.endsWith("/") ||
	new URL(base, "http://fixture.invalid").pathname !== base
)
	throw new Error("Invalid built manifest scope.");
if (process.env.PUBLIC_BASE) {
	const segments = process.env.PUBLIC_BASE.split("/").filter(Boolean);
	const expected = segments.length ? "/" + segments.join("/") + "/" : "/";
	if (expected !== base) throw new Error("Configured base differs from the built artifact.");
}
const origin = JSON.parse(await readFile("src/lib/shared/site-contract-origin.json", "utf8"));
const hash = createHash("sha256")
	.update(await readFile("src/lib/shared/site-contract.ts"))
	.digest("hex");
if (origin.sha256 !== hash)
	throw new Error("Portable contract differs from its pinned owner. Materialize the shared source before building.");
for (const [path, expected] of Object.entries(origin.companions ?? {})) {
	const actual = createHash("sha256")
		.update(await readFile(path))
		.digest("hex");
	if (actual !== expected) throw new Error("Shared companion differs from pinned source: " + path);
}

const exists = async (path) => {
	try {
		const entry = await stat(path);
		return entry.isFile() || (entry.isDirectory() && (await stat(join(path, "index.html"))).isFile());
	} catch {
		return false;
	}
};
let pages = 0,
	links = 0;
async function inspect(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			await inspect(path);
			continue;
		}
		if (!entry.name.endsWith(".html")) continue;
		pages++;
		const html = await readFile(path, "utf8");
		for (const match of html.matchAll(/<(?:a|link|script|img|meta)\b[^>]*>/g)) {
			const attributes = {};
			for (const attribute of match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))
				attributes[attribute[1]] = attribute[2] ?? attribute[3] ?? attribute[4];
			const canonical =
				attributes.rel === "canonical" ||
				["og:url", "og:image"].includes(attributes.property) ||
				attributes.name === "twitter:image";
			const value = canonical ? (attributes.href ?? attributes.content) : (attributes.href ?? attributes.src);
			if (!value || value.startsWith("#") || /^(?:mailto|tel|data|blob):/.test(value)) continue;
			if (!canonical && /^[a-z][a-z0-9+.-]*:\/\//i.test(value)) continue;
			const url = new URL(value, "https://fixture.invalid");
			if (!url.pathname.startsWith(base))
				throw new Error("Output path omits configured base: " + value + " in " + path);
			const relative = decodeURIComponent(url.pathname.slice(base.length));
			if (!(canonical && entry.name === "404.html") && !(await exists(resolve(root, relative))))
				throw new Error("Broken generated internal link: " + value + " in " + path);
			links++;
		}
	}
}
await inspect(root);
const required = ["sitemap-index.xml", "site.webmanifest"];
try {
	await stat("src/pages/rss.xml.ts");
	required.push("rss.xml");
} catch {
	/* Feed is optional after removing the content feature. */
}
try {
	await stat("src/pages/search.astro");
	required.push("pagefind/pagefind.js");
} catch {
	/* Search is optional. */
}
for (const file of required)
	if (!(await exists(join(root, file)))) throw new Error("Missing generated artifact: " + file);
if (manifest.start_url !== base || manifest.scope !== base) throw new Error("Manifest launch/scope omits base.");
for (const icon of manifest.icons)
	if (!icon.src.startsWith(base) || !(await exists(join(root, icon.src.slice(base.length)))))
		throw new Error("Broken manifest icon: " + icon.src);
console.log(
	"PASS",
	pages,
	"built pages and",
	links,
	"internal/canonical references under",
	base,
	"with pinned portable contract",
	hash,
);
