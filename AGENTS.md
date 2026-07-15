# AGENTS.md

Guidance for AI coding agents working in this repository. Humans should read [README.md](./README.md) first; this file captures the conventions and gotchas that are easy to get wrong.

## What this is

A statically generated Astro coming-soon starter: Astro 7 + React 19 (islands only) + Tailwind CSS 4 (CSS-first) + shadcn/ui conventions. Output is fully static and deploys to any static host, GitHub Pages included. Package manager is **pnpm** (see `packageManager` in `package.json`); do not introduce npm/yarn lockfiles.

## Commands

- `pnpm dev` — dev server at http://localhost:4321
- `pnpm build` — runs `astro check` then `astro build`
- `pnpm check` — read-only gate: format check → lint → typecheck. **Run this before finishing any change.**
- `pnpm fix` — auto-apply formatting and lint fixes
- `pnpm typecheck` — `astro check` on its own

CI (`.github/workflows/deploy.yml`) runs the same `check` steps on every push and PR to `main`, then builds and deploys on push. Keep `pnpm check` green.

## Code style (enforced, don't fight it)

Formatting is **oxfmt**, linting is **oxlint** — both configured in `.oxfmtrc.json` / `.oxlintrc.json` and run on staged files by a lefthook pre-commit hook.

- **Tabs** for indentation, double quotes, trailing commas, 120-col print width.
- Imports are auto-sorted (`sortImports`); Tailwind class lists inside `cn()` / `cva()` are auto-sorted. Don't hand-order either — run `pnpm fix`.
- TypeScript is strict (`astro/tsconfigs/strict` + `strictNullChecks`). No `any` escape hatches.
- Path alias `@/*` → `src/*`. Use it instead of long relative paths.

## Architecture conventions

- **`src/config/site.ts` is the single source of truth** for name, description, url, base, locale, theme colors, social links, and GTM id. Read from `siteConfig` rather than hardcoding.
- **Deployment overrides via env**, not code edits: `PUBLIC_SITE_URL` and `PUBLIC_BASE` are read in `astro.config.ts` through Vite's `loadEnv` (falling back to `siteConfig`); `PUBLIC_GTM_ID` goes through the typed `astro:env` schema (`astro:env/client`). See `.env.example`. On GitHub Pages these are set as repo Actions **variables**.
- **Base-aware asset paths**: never write a raw `/foo.png`. Use `getAssetPath("foo.png")` from `src/lib/utils.ts` so project-subpath deployments (`/repo/`) resolve correctly. `trailingSlash: "always"` is set — keep internal links consistent.
- **React is islands-only.** Components under `src/components/ui/` are shadcn-style React primitives; they render statically unless a page adds a `client:*` directive. Don't assume hydration.
- **shadcn/ui**: config in `components.json` (new-york style, neutral base, CSS variables). Add primitives with the shadcn CLI; aliases (`@/components/ui`, `@/lib/utils`, etc.) are already wired.
- **Styling**: Tailwind 4 CSS-first. Design tokens and `@keyframes` live in `src/styles/global.css` (`@theme` block); prose overrides in `src/styles/typography.css`. Use theme tokens (`--foreground`, `--muted-foreground`, `--primary`, `--border`, …) so light/dark both work. Respect the existing `prefers-reduced-motion` block — new animations should degrade under it.
- **SEO**: page metadata flows through the typed `SeoData` contract (`src/types/seo.ts`) into `Head.astro`. Add meta via that contract, not ad-hoc `<meta>` tags in pages.

## Gotchas

- **`lucide-react` no longer ships brand icons** (Instagram, X/Twitter, etc.). The hero uses inline SVG paths for those — don't try to import them from lucide.
- **`vite` is a direct devDependency** because `astro.config.ts` imports `loadEnv` from it. Keep it in `package.json`.
- Theme is initialized by an inline script in `Head.astro` before paint to avoid FOUC; the `.dark` class on `<html>` drives the `dark:` variant. Don't move that logic into a hydrated component.
- GTM markup only renders when an id is present (env var or `siteConfig.gtmId`); an empty id emits nothing.

## Before you finish

1. `pnpm check` passes (format, lint, typecheck).
2. `pnpm build` succeeds.
3. For visual/behavioral changes, verify in the browser in **both** light and dark and at a mobile width.
