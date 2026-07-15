export type StructuredData = Record<string, unknown> | Record<string, unknown>[];

export interface SeoData {
	title?: string;
	description?: string;
	canonicalPath?: string;
	image?: string;
	imageAlt?: string;
	openGraphType?: string;
	noindex?: boolean;
	nofollow?: boolean;
	structuredData?: StructuredData;
}
