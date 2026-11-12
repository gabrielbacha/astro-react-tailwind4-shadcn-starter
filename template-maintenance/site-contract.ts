export type SiteRelativePath = string & { readonly __publicPath?: never };
export type PublicPath = string & { readonly __publicPath: true };

/** Authoritative portable contract. Template copies are verified by scripts/update-template-contracts.mjs. */
export function validatePageSize(value: number): number {
	if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Page size must be a positive safe integer.");
	return value;
}
export function encodeRouteSegments(value: string): string {
	const segments = value.split("/");
	if (
		!value ||
		segments.some(
			(segment) =>
				!segment ||
				segment === "." ||
				segment === ".." ||
				/[?#%\\]/.test(segment) ||
				[...segment].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127),
		)
	)
		throw new Error("Unsupported route key: " + value);
	return segments.map((segment) => encodeURIComponent(segment)).join("/");
}
export function tagSlug(value: string): string {
	const slug = value
		.trim()
		.normalize("NFKD")
		.replace(/\p{Mark}/gu, "")
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^\p{Letter}\p{Number}]+/gu, "-")
		.replace(/^-+|-+$/g, "");
	if (!slug) throw new Error("Tag cannot form a route: " + value);
	return slug;
}
/** Input is site-relative; callers must not pass an already based public path. */
export function publicPath(base: string, relative: SiteRelativePath): PublicPath {
	const cleanBase = "/" + base.split("/").filter(Boolean).join("/");
	const prefix = cleanBase === "/" ? "/" : cleanBase + "/";
	const path = relative.replace(/^\/+/, "");
	if (/^[a-z][a-z0-9+.-]*:/i.test(path) || relative.startsWith("//")) throw new Error("Expected a site-relative path.");
	return (prefix + path) as PublicPath;
}
export function calendarDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(locale.replace(/_/g, "-"), { ...options, timeZone: "UTC" }).format(date);
}
export function routeRegistry() {
	const paths = new Map<string, string>();
	return {
		add(path: string, owner: string) {
			const key = path.replace(/^\/+|\/+$/g, "");
			const existing = paths.get(key);
			if (existing !== undefined) throw new Error("Route collision at /" + key + ": " + existing + " and " + owner);
			paths.set(key, owner);
		},
		paths,
	};
}

export function buildCutoff(value?: string): string {
	const date = value === undefined ? new Date() : new Date(value);
	if (!Number.isFinite(date.valueOf())) throw new Error("Publication cutoff must be a valid timestamp.");
	return date.toISOString();
}

/** Standalone browser function: serialized inline before first paint. */
function bootstrapTheme(colors: { light: string; dark: string }) {
	type Theme = "light" | "dark";
	const valid = (value: string | null): Theme | null => (value === "light" || value === "dark" ? value : null);
	const media = window.matchMedia("(prefers-color-scheme: dark)");
	let chosen: Theme | null = null;
	try {
		chosen = valid(localStorage.getItem("theme"));
	} catch {
		/* Memory preference works without storage. */
	}
	const syncButtons = (theme: Theme) => {
		for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
			const label = "Switch to " + (theme === "dark" ? "light" : "dark") + " theme";
			button.setAttribute("aria-pressed", String(theme === "dark"));
			button.setAttribute("aria-label", label);
			button.title = label;
		}
	};
	const apply = (theme: Theme) => {
		const root = document.documentElement;
		root.classList.toggle("dark", theme === "dark");
		root.dataset.theme = theme;
		root.style.colorScheme = theme;
		document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors[theme]);
		syncButtons(theme);
	};
	const implicit = (): Theme => (media.matches ? "dark" : "light");
	apply(chosen ?? implicit());
	document.addEventListener(
		"DOMContentLoaded",
		() => syncButtons(document.documentElement.classList.contains("dark") ? "dark" : "light"),
		{ once: true },
	);
	document.addEventListener("click", (event) => {
		if (!(event.target instanceof Element) || !event.target.closest("[data-theme-toggle]")) return;
		chosen = document.documentElement.classList.contains("dark") ? "light" : "dark";
		try {
			localStorage.setItem("theme", chosen);
		} catch {
			/* Keep this page's explicit choice. */
		}
		apply(chosen);
	});
	media.addEventListener("change", () => {
		if (chosen === null) apply(implicit());
	});
	window.addEventListener("storage", (event) => {
		if (event.key === "theme") {
			chosen = valid(event.newValue);
			apply(chosen ?? implicit());
		}
	});
}
export function themeBootstrapSource(colors: { light: string; dark: string }): string {
	return "(" + bootstrapTheme.toString() + ")(" + JSON.stringify(colors).replaceAll("<", "\\u003c") + ");";
}
export function publicURL(path: PublicPath, site: string | URL): string {
	return new URL(path, site).href;
}
export function webManifest(config: { name: string; themeColor: { dark: string } }, base: string) {
	return {
		name: config.name,
		short_name: config.name,
		start_url: publicPath(base, ""),
		scope: publicPath(base, ""),
		icons: [
			{ src: publicPath(base, "android-chrome-192x192.png"), sizes: "192x192", type: "image/png" },
			{ src: publicPath(base, "android-chrome-512x512.png"), sizes: "512x512", type: "image/png" },
		],
		theme_color: config.themeColor.dark,
		background_color: config.themeColor.dark,
		display: "standalone",
	};
}
