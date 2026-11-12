import { defineConfig } from "@playwright/test";
export default defineConfig({
	testDir: "tests/browser",
	fullyParallel: false,
	workers: 1,
	reporter: "list",
	use: { headless: true },
	timeout: 30000,
});
