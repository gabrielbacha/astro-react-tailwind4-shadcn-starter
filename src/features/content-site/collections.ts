import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const blog = defineCollection({
	loader: glob({
		base: "./src/features/content-site/content/blog",
		pattern: "**/*.{md,mdx}",
	}),
	schema: ({ image }) =>
		z
			.object({
				title: z.string().trim().min(1),
				description: z.string().trim().min(1),
				publishedAt: z.coerce.date(),
				updatedAt: z.coerce.date().optional(),
				author: z.string().trim().min(1).optional(),
				tags: z.array(z.string().trim().min(1)).default([]),
				draft: z.boolean().default(false),
				cover: image().optional(),
				coverAlt: z.string().trim().min(1).optional(),
			})
			.superRefine((data, context) => {
				if (data.cover && !data.coverAlt) {
					context.addIssue({
						code: "custom",
						path: ["coverAlt"],
						message: "coverAlt is required when cover is set",
					});
				}

				if (data.updatedAt && data.updatedAt < data.publishedAt) {
					context.addIssue({
						code: "custom",
						path: ["updatedAt"],
						message: "updatedAt cannot be earlier than publishedAt",
					});
				}

				const normalizedTags = data.tags.map((tag) => tag.toLocaleLowerCase());
				if (new Set(normalizedTags).size !== normalizedTags.length) {
					context.addIssue({
						code: "custom",
						path: ["tags"],
						message: "Tags must be unique within a post",
					});
				}
			}),
});

export const contentSiteCollections = { blog };
