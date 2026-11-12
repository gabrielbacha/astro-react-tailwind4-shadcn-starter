import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, extname, sep } from "node:path";
/** @param {string} directory @param {string | undefined} [base] */
export async function serveBuilt(directory, base = undefined) {
	const root = resolve(directory);
	const manifest = JSON.parse(await readFile(resolve(root, "site.webmanifest"), "utf8"));
	const prefix = manifest.scope;
	if (
		typeof prefix !== "string" ||
		!prefix.startsWith("/") ||
		!prefix.endsWith("/") ||
		new URL(prefix, "http://fixture.invalid").pathname !== prefix
	)
		throw new Error("Invalid built manifest scope.");
	if (base) {
		const segments = base.split("/").filter(Boolean);
		const expected = segments.length ? "/" + segments.join("/") + "/" : "/";
		if (expected !== prefix) throw new Error("Requested base differs from the built artifact.");
	}

	const types = {
		".html": "text/html",
		".js": "text/javascript",
		".css": "text/css",
		".svg": "image/svg+xml",
		".png": "image/png",
		".webp": "image/webp",
		".woff2": "font/woff2",
		".wasm": "application/wasm",
		".json": "application/json",
		".webmanifest": "application/manifest+json",
		".xml": "application/xml",
	};
	const server = createServer(async (request, response) => {
		try {
			const pathname = new URL(request.url, "http://localhost").pathname;
			if (!pathname.startsWith(prefix)) {
				response.writeHead(404).end();
				return;
			}
			let target = resolve(root, decodeURIComponent(pathname.slice(prefix.length)));
			if (target !== root && !target.startsWith(root + sep)) {
				response.writeHead(400).end();
				return;
			}
			if ((await stat(target)).isDirectory()) target = resolve(target, "index.html");
			response.writeHead(200, {
				"content-type": types[extname(target)] ?? "application/octet-stream",
				"cache-control": "no-store",
			});
			response.end(await readFile(target));
		} catch {
			response.writeHead(404).end();
		}
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	return {
		url: "http://127.0.0.1:" + server.address().port + prefix,
		close: () => new Promise((resolve) => server.close(resolve)),
	};
}
