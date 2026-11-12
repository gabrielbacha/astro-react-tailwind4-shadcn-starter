import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
const source = process.cwd(),
	directory = await mkdtemp(join(tmpdir(), "astro-content-cutoff-"));
try {
	await cp(source, directory, {
		recursive: true,
		filter: (path) =>
			!["node_modules", ".git", ".astro", "dist", "test-results"].includes(basename(path)) &&
			!basename(path).startsWith(".env"),
	});
	await symlink(join(source, "node_modules"), join(directory, "node_modules"));
	const content = join(directory, "src/features/content-site/content/blog");
	await rm(content, { recursive: true, force: true });
	await mkdir(content, { recursive: true });
	for (const [id, date] of [
		["visible", "2026-07-14"],
		["future", "2026-07-15"],
	])
		await writeFile(
			join(content, id + ".md"),
			`---\ntitle: ${id}\ndescription: Synthetic publication acceptance.\npublishedAt: ${date}\ntags: [${id}]\nauthor: Fixture\n---\nSynthetic ${id}.\n`,
		);
	const bin = JSON.parse(await readFile(join(source, "node_modules/astro/package.json"), "utf8")).bin.astro;
	execFileSync(process.execPath, [resolve(source, "node_modules/astro", bin), "build"], {
		cwd: directory,
		env: {
			...process.env,
			PUBLIC_SITE_URL: "https://fixture.invalid",
			PUBLIC_BASE: "/news/",
			PUBLIC_GTM_ID: "",
			ASTRO_PUBLICATION_CUTOFF: "2026-07-14T23:59:59.000Z",
		},
		stdio: "pipe",
	});
	await stat(join(directory, "dist/blog/visible/index.html"));
	let future = false;
	try {
		future = (await stat(join(directory, "dist/blog/future/index.html"))).isFile();
	} catch {}
	const feed = await readFile(join(directory, "dist/rss.xml"), "utf8"),
		tags = await readFile(join(directory, "dist/tags/index.html"), "utf8");
	if (future || feed.includes("/blog/future/") || tags.includes("/tags/future/"))
		throw new Error("Publication membership diverged between routes, feed or tags.");
	console.log("PASS single fixed cutoff selects the same content in routes, tags and RSS under /news/.");
} finally {
	await rm(directory, { recursive: true, force: true });
}
