import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { publicPath, type SiteRelativePath } from "@/lib/shared/site-contract";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getAssetPath(path: SiteRelativePath) {
	return publicPath(import.meta.env.BASE_URL, path);
}
