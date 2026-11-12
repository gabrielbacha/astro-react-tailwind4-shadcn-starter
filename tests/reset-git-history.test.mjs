import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm, rename, lstat, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { assertStandaloneGit, resetGitHistory } from "../scripts/lib/reset-git-history.mjs";

async function fixture(t) {
	const directory = await mkdtemp(join(tmpdir(), "astro-history-test-")),
		root = join(directory, "project");
	await mkdir(root);
	t.after(() => rm(directory, { recursive: true, force: true }));
	const run = (command, args) =>
		execFileSync(command, args, {
			cwd: root,
			encoding: "utf8",
			env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" },
			stdio: "pipe",
		}).trim();
	run("git", ["init", "-b", "main"]);
	run("git", ["config", "user.name", "Fixture"]);
	run("git", ["config", "user.email", "fixture@example.invalid"]);
	await writeFile(join(root, "README.md"), "original\n");
	run("git", ["add", "."]);
	run("git", ["commit", "-m", "Original"]);
	await writeFile(join(root, "README.md"), "original\nstaged work\n");
	run("git", ["add", "README.md"]);
	await writeFile(join(root, "README.md"), "original\nstaged work\nunstaged work\n");
	const head = run("git", ["rev-parse", "HEAD"]),
		index = await readFile(join(root, ".git/index")),
		working = await readFile(join(root, "README.md"));
	const options = {
		root,
		repository: { hasGit: true, gitName: "Fixture", gitEmail: "fixture@example.invalid" },
		originals: new Map(),
		restoreOriginals: async () => {},
		run,
		runPnpm: () => {},
		warn: () => {},
	};
	const unchanged = async () => {
		assert.equal(run("git", ["rev-parse", "HEAD"]), head);
		assert.deepEqual(await readFile(join(root, ".git/index")), index);
		assert.deepEqual(await readFile(join(root, "README.md")), working);
	};
	return { root, directory, run, options, unchanged };
}

test("first backup rename failure never removes original Git history", async (t) => {
	const f = await fixture(t);
	let removals = 0;
	await assert.rejects(
		resetGitHistory({
			...f.options,
			files: {
				lstat,
				rename: async () => {
					throw new Error("rename refused");
				},
				rm: async () => {
					removals++;
				},
			},
		}),
		/rename refused/,
	);
	assert.equal(removals, 0);
	await f.unchanged();
});
for (const stage of ["init", "commit", "hook"])
	test(stage + " failure restores complete original history and both sets of working edits", async (t) => {
		const f = await fixture(t);
		const run = (command, args) => {
			if (args[0] === stage) throw new Error(stage + " refused");
			return f.run(command, args);
		};
		await assert.rejects(
			resetGitHistory({
				...f.options,
				run,
				runPnpm: () => {
					if (stage === "hook") throw new Error("hook refused");
				},
			}),
			/refused/,
		);
		await f.unchanged();
	});
test("accepted fresh commit keeps the full backup and never runs destructive backup cleanup", async (t) => {
	const f = await fixture(t);
	let warning = "";
	const result = await resetGitHistory({
		...f.options,
		warn: (text) => {
			warning = text;
		},
		files: {
			lstat,
			rename,
			rm: async () => {
				throw new Error("cleanup must never run after commit");
			},
		},
	});
	assert.ok(result.backupPath);
	assert.match(warning, /retained/);
	assert.equal(f.run("git", ["status", "--porcelain"]), "");
	const oldHead = execFileSync("git", ["--git-dir=" + result.backupPath, "rev-parse", "HEAD"], {
		encoding: "utf8",
	}).trim();
	assert.notEqual(oldHead, f.run("git", ["rev-parse", "HEAD"]));
	assert.ok((await readdir(result.backupPath)).includes("objects"));
});
test("linked worktree .git file is refused before mutation", async (t) => {
	const f = await fixture(t);
	await rm(join(f.root, ".git"), { recursive: true });
	await writeFile(join(f.root, ".git"), "gitdir: /synthetic/linked\n");
	await assert.rejects(assertStandaloneGit(f.root, true), /Linked worktrees/);
	assert.equal(await readFile(join(f.root, ".git"), "utf8"), "gitdir: /synthetic/linked\n");
});
