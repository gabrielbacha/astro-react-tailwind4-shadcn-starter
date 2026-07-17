---
title: "Base paths are part of the design"
description: "Subpath deployment works when links, feeds, images, and search bundles share one URL contract from the beginning."
publishedAt: 2026-06-28
tags:
  - Deployment
  - Astro
---

Static sites often work perfectly at `/` and then break when deployed under a repository path. The failure usually comes from one raw root-relative link hiding among otherwise correct URLs.

## Use one path boundary

This starter sends internal links through its base-aware path helper. The content module builds article, tag, feed, pagination, and search URLs on top of that same helper.

Search needs special attention because its index is generated after Astro finishes building. The search page loads the generated bundle from the configured base path and tells Pagefind to prefix result URLs with that base.

## Verify the generated site

A successful build only proves that files were emitted. A subpath build should also be inspected for:

1. canonical URLs;
2. navigation and pagination links;
3. image and search bundle paths;
4. RSS item URLs.

Treating the base path as an architectural input keeps deployment from becoming a collection of late string replacements.
