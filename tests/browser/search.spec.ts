import { test, expect } from "@playwright/test";

import { serveBuilt } from "../../scripts/serve-built.mjs";
let host: Awaited<ReturnType<typeof serveBuilt>>;
test.beforeAll(async () => {
	host = await serveBuilt(process.env.ASTRO_TEST_DIST ?? "dist", process.env.PUBLIC_BASE || undefined);
});
test.afterAll(async () => {
	await host?.close();
});
test.beforeEach(async ({ page }) => {
	await page.route("**/*", (route) =>
		new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort(),
	);
});
const synthetic = `export async function options(){}; export async function init(){}; export async function search(query){ window.fixtureSearches.push(query); if(query==='obsolete') await new Promise(resolve=>window.fixtureRelease=resolve); return {results:Array.from({length:25},(_,i)=>({data:async()=>{window.fixtureDetails.push(query+':'+i);return {url:'/blog/fixture-'+i+'/',meta:{title:query+' '+i},plain_excerpt:'Synthetic result'}}}))}; }`;
test("real built Pagefind index searches published articles", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.goto(host.url + "search/?q=content");
	await expect(page.locator("[data-search-results] li").first()).toBeVisible();
	expect(errors).toEqual([]);
});
test("all 25 synthetic matches are reachable and typing invalidates old detail work", async ({ page }) => {
	await page.addInitScript(() => {
		Object.assign(window, { fixtureSearches: [], fixtureDetails: [] });
	});
	await page.route("**/pagefind/pagefind.js*", (route) =>
		route.fulfill({ contentType: "text/javascript", body: synthetic }),
	);
	await page.goto(host.url + "search/?utm_source=fixture#kept");
	const input = page.getByRole("searchbox", { name: "Search articles", exact: true });
	await input.fill("current");
	await expect(page.locator("[data-search-results] li")).toHaveCount(20);
	await page.getByRole("button", { name: "Load more results", exact: true }).click();
	await expect(page.locator("[data-search-results] li")).toHaveCount(25);
	await expect(page.getByRole("button", { name: "Load more results", exact: true })).not.toBeVisible();
	expect(new URL(page.url()).searchParams.get("utm_source")).toBe("fixture");
	expect(new URL(page.url()).hash).toBe("#kept");
	await input.fill("obsolete");
	await page.waitForFunction(
		() => typeof (window as unknown as { fixtureRelease: unknown }).fixtureRelease === "function",
	);
	await input.fill("newer");
	await page.evaluate(() => (window as unknown as { fixtureRelease: () => void }).fixtureRelease());
	await expect(page.locator("[data-search-results] h2").first()).toHaveText("newer 0");
	const details = await page.evaluate(() => (window as unknown as { fixtureDetails: string[] }).fixtureDetails);
	expect(details.some((value) => value.startsWith("obsolete:"))).toBe(false);
});
test("failed initial index import can retry without reloading", async ({ page }) => {
	let fail = true;
	await page.addInitScript(() => {
		Object.assign(window, { fixtureSearches: [], fixtureDetails: [] });
	});
	await page.route("**/pagefind/pagefind.js*", (route) =>
		fail ? route.abort() : route.fulfill({ contentType: "text/javascript", body: synthetic }),
	);
	await page.goto(host.url + "search/?q=retry");
	const retry = page.getByRole("button", { name: "Retry search", exact: true });
	await expect(retry).toBeVisible();
	fail = false;
	await retry.click();
	await expect(page.locator("[data-search-results] li")).toHaveCount(20);
});
