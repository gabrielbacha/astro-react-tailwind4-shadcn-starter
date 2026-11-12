import { execFileSync } from "node:child_process";
import { cp, mkdtemp, rm, symlink, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
const source = process.cwd(),
	directory = await mkdtemp(join(tmpdir(), "astro-feature-removal-"));
try {
	await cp(source, directory, {
		recursive: true,
		filter: (path) =>
			!["node_modules", ".git", ".astro", "dist", "test-results"].includes(basename(path)) &&
			!basename(path).startsWith(".env"),
	});
	await symlink(join(source, "node_modules"), join(directory, "node_modules"));
	for (const path of [
		"src/features/content-site",
		"src/content.config.ts",
		"src/pages/blog",
		"src/pages/tags",
		"src/pages/search.astro",
		"src/pages/rss.xml.ts",
		"tests/browser/search.spec.ts",
		"scripts/check-publication-fixture.mjs",
	])
		await rm(join(directory, path), { recursive: true, force: true });
	let config = await readFile(join(directory, "astro.config.ts"), "utf8");
	config = config
		.replace(/^import .*validateContentAdapters.*\n/m, "")
		.replace(/^import .*contentRoutes.*\n/m, "")
		.replace(/^validateContentAdapters\(.*\);\n/m, "");
	await writeFile(join(directory, "astro.config.ts"), config);
	const site = await readFile(join(directory, "src/config/site.ts"), "utf8");
	await writeFile(join(directory, "src/config/site.ts"), site.replace(/navigation: \[[\s\S]*?\],/, "navigation: [],"));
	const env = { ...process.env, PUBLIC_SITE_URL: "https://fixture.invalid", PUBLIC_BASE: "/news/", PUBLIC_GTM_ID: "" };
	const bin = JSON.parse(await readFile(join(source, "node_modules/astro/package.json"), "utf8")).bin.astro;
	for (const command of ["check", "build"])
		execFileSync(process.execPath, [resolve(source, "node_modules/astro", bin), command], {
			cwd: directory,
			env,
			stdio: "pipe",
		});
	console.log(
		execFileSync(process.execPath, ["scripts/check-built.mjs"], { cwd: directory, env, encoding: "utf8" }).trim(),
	);
	console.log(
		"PASS content feature removal retains independent shared metadata, manifest and theme source under /news/.",
	);
} finally {
	await rm(directory, { recursive: true, force: true });
}
