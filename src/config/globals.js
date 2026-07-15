// src/config/globals.js

export const globals = {
	// Google Tag Manager
	// TODO: set your container ID (e.g. "GTM-XXXXXXX") — leave empty to disable GTM
	gtmId: "",

	base: import.meta.env.BASE_URL,

	// Social Media Accounts
	// TODO: set your profile URLs
	socialMedia: {
		instagram: "#",
		twitter: "#",
	},

	// Other global variables
	siteName: "Your Brand",
	siteUrl: "https://example.com",
};

export const getGlobalValue = (key) => {
	return key.split(".").reduce((o, i) => o?.[i], globals);
};

export function getPath(path) {
	const base = import.meta.env.BASE_URL;
	const cleanPath = path.replace(/^\//, "");

	if (base && base !== "/") {
		return `${base}/${cleanPath}`;
	}
	return cleanPath;
}
