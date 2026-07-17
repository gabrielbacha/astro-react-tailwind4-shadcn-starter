export type StructuredData = Record<string, unknown> | Record<string, unknown>[];

export interface SeoData {
	title?: string;
	description?: string;
	canonicalPath?: string;
	image?: string;
	imageAlt?: string;
	openGraphType?: string;
	article?: {
		publishedTime: string;
		modifiedTime?: string;
		author?: string;
		tags?: string[];
	};
	feed?: {
		href: string;
		title: string;
	};
	noindex?: boolean;
	nofollow?: boolean;
	structuredData?: StructuredData;
}
