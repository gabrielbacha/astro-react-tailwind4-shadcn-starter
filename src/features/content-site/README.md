# Content site module

This directory contains the optional static content site. Its collection, Markdown/MDX files, components, pages, queries, RSS generation, and search interface are intentionally colocated so the feature remains easy to understand and remove.

## Authoring

Add `.md` or `.mdx` files under `content/blog/` with this frontmatter:

```yaml
---
title: "Required title"
description: "Required summary used by cards, SEO, RSS, and search"
publishedAt: 2026-07-17
updatedAt: 2026-07-18 # optional; cannot predate publishedAt
author: "Optional author" # defaults to siteConfig.name
tags: # optional; defaults to []
  - Astro
draft: false # optional; defaults to false
cover: ./_assets/example.jpg # optional local image
coverAlt: "Required whenever cover is present"
---
```

Production builds exclude drafts and posts with future publication dates from routes, tags, RSS, and search. The development server includes them for preview.

Configuration such as route prefixes, feed copy, and page size lives in `config.ts`. URL construction, filtering, tag normalization, collision checks, date formatting, and reading-time estimates live in `lib/content.ts`.

## Routes

- `/blog/` and `/blog/page/[page]/`
- `/blog/[...id]/`
- `/tags/` and `/tags/[tag]/`
- `/search/`
- `/rss.xml`

Files under `src/pages/` are deliberately thin Astro adapters. Content-specific rendering stays in this directory.

## Search

`pnpm content:index` runs Pagefind against `dist/`. The complete `pnpm build` script runs the Astro build first and then generates the index. Search therefore works in production preview (`pnpm build && pnpm preview`), while the development page explains that its index is not present yet.

Article pages alone carry `data-pagefind-body`, so archive, navigation, tag, and utility pages are not included as search records.

## Removal

1. Delete `src/features/content-site/`.
2. Delete `src/content.config.ts` and these route adapters:
   - `src/pages/blog/`
   - `src/pages/tags/`
   - `src/pages/search.astro`
   - `src/pages/rss.xml.ts`
3. Remove the Blog, Tags, and Search entries from `siteConfig.navigation`.
4. Remove `@astrojs/rss` and `pagefind`, delete `content:index`, and restore `build` to `astro check && astro build`.
5. Remove the content-module sections from the root README.

The generic navigation renderer and optional `SeoData.article` / `SeoData.feed` support can remain without the module.
