export interface SiteConfig {
	name: string;
	description: string;
	url: string;
	base: string;
	language: string;
	locale: string;
	gtmId: string;
	themeColor: {
		light: string;
		dark: string;
	};
	navigation: Array<{
		label: string;
		href: string;
	}>;
	socialMedia: {
		instagram?: string;
		twitter?: string;
	};
}

export const siteConfig: SiteConfig = {
	name: "Your Brand",
	description: "A modern, minimal coming-soon landing page built with Astro, React, and Tailwind CSS.",
	url: "https://example.com",
	base: "/",
	language: "en",
	locale: "en_US",
	gtmId: "",
	themeColor: {
		light: "#ffffff",
		dark: "#0a0a0a",
	},
	navigation: [
		{ label: "Blog", href: "blog/" },
		{ label: "Tags", href: "tags/" },
		{ label: "Search", href: "search/" },
	],
	socialMedia: {
		instagram: undefined,
		twitter: undefined,
	},
};
