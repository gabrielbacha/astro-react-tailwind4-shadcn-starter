import { randomUUID } from "node:crypto";
import { lstat, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export async function assertStandaloneGit(root, hasGit, files = { lstat }) {
	let entry;
	try {
		entry = await files.lstat(join(root, ".git"));
	} catch (error) {
		if (error.code === "ENOENT" && !hasGit) return;
		throw error;
	}
	if (!hasGit) throw new Error("Git history appeared after preflight. No history was changed.");
	if (!entry.isDirectory() || entry.isSymbolicLink())
		throw new Error("Git reset requires a standalone .git directory. Linked worktrees and symlinks are not changed.");
}

/** Keep the original history as a recovery copy after successful replacement. */
export async function resetGitHistory({
	root,
	repository,
	originals,
	restoreOriginals,
	run,
	runPnpm,
	warn,
	files = { lstat, rename, rm },
}) {
	const { hasGit, gitName, gitEmail, keepUpstream, originUrl } = repository;
	const gitPath = join(root, ".git");
	const backupPath = join(dirname(root), "." + basename(root) + "-git-backup-" + randomUUID());
	await assertStandaloneGit(root, hasGit, files);
	let moved = false,
		creating = false;
	try {
		if (hasGit) {
			await files.rename(gitPath, backupPath);
			moved = true;
		}
		creating = true;
		run("git", ["init", "-b", "main"]);
		run("git", ["config", "user.name", gitName]);
		run("git", ["config", "user.email", gitEmail]);
		if (keepUpstream && originUrl) run("git", ["remote", "add", "upstream", originUrl]);
		runPnpm(["exec", "lefthook", "install"]);
		run("git", ["add", "--all"]);
		run("git", ["commit", "-m", "Initial commit"]);
		run("git", ["rev-parse", "--verify", "HEAD"], { capture: true });
		if (run("git", ["status", "--porcelain"], { capture: true }))
			throw new Error("The new repository is unexpectedly dirty after the initial commit.");
	} catch (error) {
		const failures = [];
		let cleared = !creating;
		if (creating) {
			try {
				await files.rm(gitPath, { recursive: true, force: true });
				cleared = true;
			} catch (failure) {
				failures.push("New history could not be removed: " + failure.message);
			}
		}
		if (moved && cleared) {
			try {
				await files.rename(backupPath, gitPath);
			} catch (failure) {
				failures.push("Original history remains at " + backupPath + ": " + failure.message);
			}
		} else if (moved) failures.push("Original history remains at " + backupPath);
		try {
			await restoreOriginals(originals);
		} catch (failure) {
			failures.push("Some original files could not be restored: " + failure.message);
		}
		throw new Error(
			"Could not create fresh Git history. " +
				(failures.length ? failures.join("; ") : "Original files and history were restored.") +
				" " +
				error.message,
			{ cause: error },
		);
	}
	// Cleanup cannot roll back an accepted commit or partially destroy its recovery history.
	if (moved)
		warn(
			"Fresh history is ready. Original Git history is retained at " +
				backupPath +
				". Remove it only after checking recovery.",
		);
	return { backupPath: moved ? backupPath : null };
}
