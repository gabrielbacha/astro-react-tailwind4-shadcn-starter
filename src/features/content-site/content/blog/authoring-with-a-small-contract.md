---
title: "Authoring with a small contract"
description: "Good frontmatter asks for the information readers and platforms need without turning every post into a configuration exercise."
publishedAt: 2026-06-09
updatedAt: 2026-06-14
tags:
  - Writing
  - Architecture
---

The collection schema requires a title, description, and publication date. Those fields power the article heading, archive cards, metadata, RSS entries, and search results.

Everything else is optional:

- add tags when they help readers navigate related work;
- add an author when the site name is not the right default;
- add a cover only when the image contributes something;
- mark unfinished work as a draft.

## Validation should catch real mistakes

The schema checks relationships that individual field types cannot express. A cover needs meaningful alternative text. An update cannot predate publication. Duplicate tags inside one post are rejected before they produce repeated links.

These are useful constraints because each one prevents broken output. The schema avoids arbitrary rules about title length, tag count, or editorial style.

The contract stays small enough to remember and strict enough to trust.
