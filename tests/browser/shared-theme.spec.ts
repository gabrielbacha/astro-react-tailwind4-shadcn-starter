import { test, expect } from "@playwright/test";

import { serveBuilt } from "../../scripts/serve-built.mjs";
let host: Awaited<ReturnType<typeof serveBuilt>>;
test.beforeAll(async () => {
	host = await serveBuilt(process.env.ASTRO_TEST_DIST ?? "dist", process.env.PUBLIC_BASE || undefined);
});
test.afterAll(async () => {
	await host?.close();
});
for (const blocked of [false, true])
	test(`shared theme with storage ${blocked ? "blocked" : "available"}`, async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		await page.route("**/*", (route) =>
			new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort(),
		);
		await page.emulateMedia({ colorScheme: "dark" });
		if (blocked)
			await page.addInitScript(() => {
				Object.defineProperty(window, "localStorage", {
					get() {
						throw new Error("Synthetic storage denial");
					},
				});
			});
		await page.goto(host.url);
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		const toggle = page.getByRole("button", { name: "Switch to light theme", exact: true });
		await toggle.click();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await expect(page.getByRole("button", { name: "Switch to dark theme", exact: true })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		await page.emulateMedia({ colorScheme: "light" });
		await page.emulateMedia({ colorScheme: "dark" });
		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await page.reload();
		await expect(page.locator("html")).toHaveAttribute("data-theme", blocked ? "dark" : "light");
		const response = await page.request.get(new URL("site.webmanifest", host.url).href);
		expect(response.ok()).toBe(true);
		const manifest = await response.json();
		expect(manifest.start_url).toBe(new URL(host.url).pathname);
		expect(manifest.scope).toBe(new URL(host.url).pathname);
		expect(errors).toEqual([]);
	});
