import * as p from "@clack/prompts";
import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { access, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const root = resolve(dirname(scriptPath), "..");
const packagePath = join(root, "package.json");
const lockfilePath = join(root, "pnpm-lock.yaml");
const siteConfigPath = join(root, "src/config/site.ts");
const readmePath = join(root, "README.md");
const contentPath = join(root, "src/features/content-site/content");
const gitPath = join(root, ".git");

const siteIdentityPattern = /\t\/\/ project-init:start\n[\s\S]*?\t\/\/ project-init:end\n/;
const readmeInitializerPattern = /\n?<!-- project-init:start -->[\s\S]*?<!-- project-init:end -->\n?/;
const sampleAuthor = 'author: "Your Brand"';

function unwrap(value) {
	if (p.isCancel(value)) {
		p.cancel("Project initialization cancelled. No files were changed.");
		process.exit(0);
	}

	return value;
}

function commandError(command, args, result) {
	const detail =
		result.stderr?.trim() || result.stdout?.trim() || result.error?.message || `exit code ${result.status}`;
	return new Error(`${command} ${args.join(" ")} failed: ${detail}`);
}

function run(command, args, { capture = false, allowFailure = false } = {}) {
	const result = spawnSync(command, args, {
		cwd: root,
		encoding: "utf8",
		stdio: capture ? "pipe" : "inherit",
	});

	if (result.error || result.status !== 0) {
		if (allowFailure) return undefined;
		throw commandError(command, args, result);
	}

	return capture ? result.stdout.trim() : "";
}

function runPnpm(args, options) {
	if (process.env.npm_execpath) {
		return run(process.execPath, [process.env.npm_execpath, ...args], options);
	}

	return run(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, options);
}

function slugify(value) {
	return value
		.trim()
		.normalize("NFKD")
		.replace(/\p{Mark}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^[._-]+|[._-]+$/g, "")
		.slice(0, 214);
}

function validatePackageName(value) {
	const name = value.trim();
	if (!name) return "Enter a package name.";
	if (name.length > 214) return "Package names must be 214 characters or fewer.";
	if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) {
		return "Use a lowercase npm package name containing letters, numbers, dots, underscores, or hyphens.";
	}
	return undefined;
}

function normalizeOrigin(value) {
	try {
		const url = new URL(value.trim());
		if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
		if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
			return undefined;
		}
		return url.origin;
	} catch {
		return undefined;
	}
}

function normalizeBase(value) {
	const input = value.trim();
	if (!input || input === "/") return "/";
	if (/[?#]/.test(input)) return undefined;

	const segments = input
		.split("/")
		.filter(Boolean)
		.map((segment) => segment.trim());
	if (segments.length === 0 || segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment))) return undefined;
	if (segments.some((segment) => segment === "." || segment === "..")) return undefined;
	return `/${segments.join("/")}/`;
}

async function pathExists(path) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

async function findContentFiles(directory) {
	if (!(await pathExists(directory))) return [];
	const entries = await readdir(directory, { withFileTypes: true });
	const paths = [];

	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) paths.push(...(await findContentFiles(path)));
		else if (entry.isFile() && /\.mdx?$/.test(entry.name)) paths.push(path);
	}

	return paths;
}

async function readOriginals(paths) {
	const originals = new Map();
	for (const path of paths) originals.set(path, await readFile(path, "utf8"));
	return originals;
}

async function restoreOriginals(originals) {
	for (const [path, content] of originals) await writeFile(path, content);
}

async function preflight() {
	run("git", ["--version"], { capture: true });

	const contentFiles = await findContentFiles(contentPath);
	const authorFiles = [];
	for (const path of contentFiles) {
		if ((await readFile(path, "utf8")).includes(sampleAuthor)) authorFiles.push(path);
	}
	if (authorFiles.length === 0)
		throw new Error(`Expected at least one exact ${JSON.stringify(sampleAuthor)} placeholder.`);

	const requiredPaths = [packagePath, lockfilePath, siteConfigPath, readmePath, scriptPath, ...authorFiles];
	for (const path of requiredPaths) {
		await access(path, constants.R_OK | constants.W_OK);
	}
	await access(root, constants.W_OK);
	await access(dirname(root), constants.W_OK);

	const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
	if (packageJson.scripts?.["project:init"] !== "node scripts/project-init.mjs") {
		throw new Error('Expected package.json to contain the "project:init" initializer script.');
	}
	if (!packageJson.devDependencies?.["@clack/prompts"]) {
		throw new Error("Expected @clack/prompts to be installed as a development dependency.");
	}

	const siteConfig = await readFile(siteConfigPath, "utf8");
	if (!siteIdentityPattern.test(siteConfig)) throw new Error("The project-init markers are missing from siteConfig.");
	const readme = await readFile(readmePath, "utf8");
	if (!readmeInitializerPattern.test(readme)) throw new Error("The project-init markers are missing from README.md.");
	if (!readme.startsWith("# ")) throw new Error("Expected README.md to begin with a project title.");

	const gitName = run("git", ["config", "--get", "user.name"], { capture: true, allowFailure: true });
	const gitEmail = run("git", ["config", "--get", "user.email"], { capture: true, allowFailure: true });
	if (!gitName || !gitEmail) {
		throw new Error("Configure Git user.name and user.email before running the initializer.");
	}

	const hasGit = await pathExists(gitPath);
	if (hasGit) {
		const topLevel = run("git", ["rev-parse", "--show-toplevel"], { capture: true });
		if (resolve(topLevel) !== root) throw new Error("Run the initializer from the boilerplate repository root.");
	}

	return {
		authorFiles,
		dirtyStatus: hasGit ? run("git", ["status", "--porcelain"], { capture: true }) : "",
		gitEmail,
		gitName,
		hasGit,
		originUrl: hasGit ? run("git", ["remote", "get-url", "origin"], { capture: true, allowFailure: true }) : undefined,
	};
}

async function collectAnswers(originUrl) {
	const currentPackage = JSON.parse(await readFile(packagePath, "utf8"));
	const defaultBrand = basename(root)
		.split(/[-_]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

	const siteName = unwrap(
		await p.text({
			message: "Site or brand name",
			initialValue: defaultBrand || "Your Brand",
			validate: (value) => (value.trim() ? undefined : "Enter a site or brand name."),
		}),
	).trim();
	const packageName = unwrap(
		await p.text({
			message: "Package name",
			initialValue: slugify(siteName) || currentPackage.name,
			validate: validatePackageName,
		}),
	).trim();
	const description = unwrap(
		await p.text({
			message: "Site description",
			initialValue: `A modern website for ${siteName}.`,
			validate: (value) => (value.trim() ? undefined : "Enter a site description."),
		}),
	).trim();
	const siteUrlInput = unwrap(
		await p.text({
			message: "Production site origin",
			initialValue: "https://example.com",
			validate: (value) =>
				normalizeOrigin(value) ? undefined : "Enter an HTTP(S) origin without a path, query, or fragment.",
		}),
	);
	const baseInput = unwrap(
		await p.text({
			message: "Deployment base path",
			initialValue: "/",
			validate: (value) => (normalizeBase(value) ? undefined : "Use / or URL-safe path segments such as /my-project/."),
		}),
	);
	const keepUpstream = originUrl
		? unwrap(
				await p.confirm({
					message: `Keep ${originUrl} as the optional upstream remote?`,
					initialValue: false,
				}),
			)
		: false;

	return {
		base: normalizeBase(baseInput),
		description,
		keepUpstream,
		packageName,
		siteName,
		siteUrl: normalizeOrigin(siteUrlInput),
	};
}

function configuredSiteBlock(answers) {
	return [
		`\tname: ${JSON.stringify(answers.siteName)},`,
		`\tdescription: ${JSON.stringify(answers.description)},`,
		`\turl: ${JSON.stringify(answers.siteUrl)},`,
		`\tbase: ${JSON.stringify(answers.base)},`,
		"",
	].join("\n");
}

async function writeConfiguredFiles(answers, sampleFiles) {
	const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
	packageJson.name = answers.packageName;
	packageJson.description = answers.description;
	await writeFile(packagePath, `${JSON.stringify(packageJson, null, "\t")}\n`);

	const siteConfig = await readFile(siteConfigPath, "utf8");
	await writeFile(
		siteConfigPath,
		siteConfig.replace(siteIdentityPattern, () => configuredSiteBlock(answers)),
	);

	const readme = await readFile(readmePath, "utf8");
	const configuredReadme = readme
		.replace(/^# .+$/m, () => `# ${answers.siteName}`)
		.replace(readmeInitializerPattern, "\n")
		.replace(/^\| `pnpm project:init`.*\n/m, "");
	await writeFile(readmePath, configuredReadme);

	for (const path of sampleFiles) {
		const content = await readFile(path, "utf8");
		if (content.includes(sampleAuthor)) {
			await writeFile(
				path,
				content.replaceAll(sampleAuthor, () => `author: ${JSON.stringify(answers.siteName)}`),
			);
		}
	}
}

async function removeInitializer() {
	const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
	delete packageJson.scripts["project:init"];
	delete packageJson.devDependencies["@clack/prompts"];
	await writeFile(packagePath, `${JSON.stringify(packageJson, null, "\t")}\n`);
	await rm(scriptPath);
	runPnpm(["install", "--lockfile-only", "--ignore-scripts", "--offline"], { capture: true });

	const lockfile = await readFile(lockfilePath, "utf8");
	const importers = lockfile.match(/^importers:\n([\s\S]*?)^packages:/m)?.[1] ?? "";
	if (/^\s{6}'?@clack\/prompts'?:/m.test(importers)) {
		throw new Error("The initializer's direct dependency remains in pnpm-lock.yaml.");
	}
}

function formatFiles(paths) {
	const relativePaths = paths.map((path) => relative(root, path));
	runPnpm(["exec", "oxfmt", ...relativePaths], { capture: true });
}

function runChecks() {
	runPnpm(["exec", "oxfmt", "--check"], { capture: true });
	runPnpm(["exec", "oxlint"], { capture: true });
	runPnpm(["exec", "astro", "check"], { capture: true });
}

async function resetGitHistory({ gitEmail, gitName, hasGit, keepUpstream, originUrl }, originals) {
	const backupPath = join(dirname(root), `.${basename(root)}-git-backup-${process.pid}-${Date.now()}`);

	try {
		if (hasGit) await rename(gitPath, backupPath);
		run("git", ["init", "-b", "main"]);
		run("git", ["config", "user.name", gitName]);
		run("git", ["config", "user.email", gitEmail]);
		if (keepUpstream && originUrl) run("git", ["remote", "add", "upstream", originUrl]);
		runPnpm(["exec", "lefthook", "install"]);
		run("git", ["add", "--all"]);
		run("git", ["commit", "-m", "Initial commit"]);
		if (run("git", ["status", "--porcelain"], { capture: true })) {
			throw new Error("The new repository is unexpectedly dirty after the initial commit.");
		}
		if (hasGit) await rm(backupPath, { recursive: true, force: true });
	} catch (error) {
		await rm(gitPath, { recursive: true, force: true });
		if (hasGit && (await pathExists(backupPath))) await rename(backupPath, gitPath);
		await restoreOriginals(originals);
		throw new Error(
			`Could not create the fresh Git history; the original files and history were restored. ${error instanceof Error ? error.message : String(error)}`,
			{ cause: error },
		);
	}
}

async function main() {
	p.intro("Initialize this Astro project");
	const repository = await preflight();
	const answers = await collectAnswers(repository.originUrl);

	if (repository.dirtyStatus) {
		p.note(repository.dirtyStatus, "Existing worktree changes");
		const includeDirty = unwrap(
			await p.confirm({
				message: "Include these existing changes in the new initial commit?",
				initialValue: false,
			}),
		);
		if (!includeDirty) {
			p.cancel("Project initialization cancelled. No files were changed.");
			return;
		}
	}

	p.note(
		[
			`Site: ${answers.siteName}`,
			`Package: ${answers.packageName}`,
			`URL: ${answers.siteUrl}`,
			`Base: ${answers.base}`,
			`Git: fresh main branch and Initial commit`,
			`Remotes: ${answers.keepUpstream ? "template remote kept as upstream" : "none"}`,
		].join("\n"),
		"Configuration summary",
	);
	const confirmed = unwrap(
		await p.confirm({
			message: "Replace the existing Git history and initialize this project?",
			initialValue: false,
		}),
	);
	if (!confirmed) {
		p.cancel("Project initialization cancelled. No files were changed.");
		return;
	}

	const affectedPaths = [packagePath, lockfilePath, siteConfigPath, readmePath, scriptPath, ...repository.authorFiles];
	const originals = await readOriginals(affectedPaths);
	const spinner = p.spinner();

	try {
		spinner.start("Writing and validating project configuration");
		await writeConfiguredFiles(answers, repository.authorFiles);
		formatFiles([packagePath, siteConfigPath, readmePath, ...repository.authorFiles]);
		runChecks();
		await removeInitializer();
		formatFiles([packagePath, siteConfigPath, readmePath, ...repository.authorFiles]);
		runChecks();
		spinner.stop("Project configuration validated");
	} catch (error) {
		spinner.stop("Project configuration failed validation");
		await restoreOriginals(originals);
		throw error;
	}

	await resetGitHistory(
		{
			gitEmail: repository.gitEmail,
			gitName: repository.gitName,
			hasGit: repository.hasGit,
			keepUpstream: answers.keepUpstream,
			originUrl: repository.originUrl,
		},
		originals,
	);

	p.outro("Project initialized. Run pnpm dev to start building.");
}

main().catch((error) => {
	p.cancel(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});
