import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const owner = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(owner, "template-maintenance/site-contract.ts"));
const hash = createHash("sha256").update(source).digest("hex");
const targets = [owner];
if (!process.argv.includes("--local")) {
	const news = resolve(owner, "../astro-news-template");
	try {
		await access(resolve(news, "package.json"));
		targets.push(news);
	} catch {
		/* A standalone descendant updates only itself. */
	}
}
for (const root of targets) {
	const directory = resolve(root, "src/lib/shared"),
		target = resolve(directory, "site-contract.ts");
	const companionHashes = {};
	const companionFiles = [
		["check-built.mjs", "scripts/check-built.mjs"],
		["serve-built.mjs", "scripts/serve-built.mjs"],
		["ci-pages.yml", ".github/workflows/deploy.yml"],
	];
	for (const [sourceName, targetName] of companionFiles) {
		const data = await readFile(resolve(owner, "template-maintenance", sourceName)),
			destination = resolve(root, targetName);
		companionHashes[targetName] = createHash("sha256").update(data).digest("hex");
		if (process.argv.includes("--check")) {
			if (!data.equals(await readFile(destination))) throw new Error(targetName + " differs from the owning template.");
		} else {
			await mkdir(dirname(destination), { recursive: true });
			await writeFile(destination, data);
		}
	}

	const origin = {
		source: "astro-react-tailwind4-shadcn-starter/template-maintenance/site-contract.ts",
		version: "1",
		sha256: hash,
		companions: companionHashes,
		update: "node scripts/update-template-contracts.mjs in the owning starter checkout",
	};
	if (process.argv.includes("--check")) {
		if (!source.equals(await readFile(target))) throw new Error(root + " contract differs from authority.");
		if (JSON.parse(await readFile(resolve(directory, "site-contract-origin.json"), "utf8")).sha256 !== hash)
			throw new Error(root + " origin revision differs from authority.");
	} else {
		await mkdir(directory, { recursive: true });
		await writeFile(target, source);
		await writeFile(resolve(directory, "site-contract-origin.json"), JSON.stringify(origin, null, "\t") + "\n");
	}
}
console.log("PASS", targets.length, "portable contract copies", hash);
