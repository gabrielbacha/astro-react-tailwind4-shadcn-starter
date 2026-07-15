# Astro Coming Soon Template

A minimal, theme-aware coming-soon starter built with Astro, React, and Tailwind CSS 4. It ships with a centered wordmark navbar, an in-flow responsive footer, shadcn/ui-style components, MDX-ready typography, and an explicit SEO stack. Everything is statically generated, so it can deploy to any static host.

## ✨ Features

- **Minimal hero** — centered coming-soon headline, supporting copy, and two CTA links
- **Responsive page shell** — accessible header, main content, footer, skip link, and mobile safe-area support
- **Theme toggle** — follows the visitor's system preference initially and persists explicit light/dark choices without a flash
- **SEO ready** — canonical URL, Open Graph, Twitter cards, JSON-LD, sitemap, `robots.txt`, and a generated web manifest
- **MDX typography** — Tailwind Typography with theme-aware `.prose` defaults
- **Google Tag Manager** — opt-in configuration; an empty ID emits no tracking markup
- **Strict TypeScript** — typed site configuration, layout metadata, Astro components, and React helpers
- **Static-first React** — React and shadcn are available without hydrating the current page

## 🎨 Tech Stack

- **Framework:** [Astro](https://astro.build) 7.x
- **UI:** [React](https://react.dev) 19.x through `@astrojs/react`
- **Styling:** [Tailwind CSS](https://tailwindcss.com) 4.x with CSS-first configuration
- **Components:** [shadcn/ui](https://ui.shadcn.com) conventions using Radix Slot and CVA
- **Content:** [MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/) and [Tailwind Typography](https://github.com/tailwindlabs/tailwindcss-typography)
- **Fonts:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) through self-hosted Fontsource files
- **SEO:** explicit typed metadata plus `@astrojs/sitemap` and `astro-robots-txt`
- **Icons:** [Lucide](https://lucide.dev)
- **Package manager:** [pnpm](https://pnpm.io) 11.11+

## 🚀 Quick Start

### Prerequisites

- **Node.js 24** recommended; Astro requires Node.js 22.12 or newer
- **pnpm 11.11+**

### Setup

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

### Scripts

| Script                            | Description                                        |
| --------------------------------- | -------------------------------------------------- |
| `pnpm dev`                        | Start the development server                       |
| `pnpm build`                      | Type-check and create the production build         |
| `pnpm preview`                    | Preview the production build locally               |
| `pnpm lint` / `pnpm lint:fix`     | Check or fix JavaScript and TypeScript lint issues |
| `pnpm format` / `pnpm format:fix` | Check or fix repository formatting                 |
| `pnpm typecheck`                  | Run `astro check`                                  |
| `pnpm check`                      | Run read-only formatting, lint, and type checks    |
| `pnpm fix`                        | Apply formatting and lint fixes                    |

Lefthook installs through the `prepare` script and formats or lints supported staged files before a commit.

## ⚙️ Configuration

Site-wide settings have one source of truth in `src/config/site.ts`:

```ts
export const siteConfig = {
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
	socialMedia: {
		instagram: undefined,
		twitter: undefined,
	},
};
```

- `url` drives Astro's canonical URLs, sitemap, Open Graph URLs, and robots output.
- `base` defaults to `/`. Set it to a repository path such as `/my-repo` when deploying a project site to GitHub Pages.
- Routes use a consistent trailing slash so sitemap and canonical URLs remain stable at both root and subpath deployments.
- Social links are optional and are not rendered until valid URLs are configured.
- GTM remains disabled while `gtmId` is empty.

### Homepage and SEO

- Edit the homepage copy and CTA links in `src/pages/index.astro`.
- Page metadata uses the typed `SeoData` contract in `src/types/seo.ts`.
- `Head.astro` emits one title, canonical metadata, social previews, theme metadata, and sanitized JSON-LD.
- The 404 page is explicitly marked `noindex, follow`.

### Branding assets

Replace the placeholder files in `public/` with your own favicon, app icons, and 1200×630 Open Graph image. The web manifest is generated from `siteConfig`, so names, theme colors, and base-aware icon paths stay synchronized.

### Theme and fonts

- The first visit follows `prefers-color-scheme`; clicking the navbar toggle saves `light` or `dark` in local storage under the `theme` key.
- Theme initialization runs before the stylesheet is painted, avoiding a light/dark flash.
- Colors use shadcn-style tokens in `src/styles/global.css`.
- JetBrains Mono loads locally through `CustomFont.astro`; replace the Fontsource import and font tokens to change it.
- Animations and transitions are CSS-only and effectively disabled for visitors who prefer reduced motion.

### MDX and typography

MDX support is enabled. Wrap rendered content in `prose` for the theme-aware typography layer:

```astro
<article class="prose mx-auto">
	<Content />
</article>
```

Override the prose tokens or content rules in `src/styles/typography.css`.

## 🏗️ Project Structure

```text
.
├── public/                         # Favicons, app icons, and Open Graph image
├── src/
│   ├── components/
│   │   ├── head-nav-footer/        # Head metadata, navbar, footer, font loader
│   │   ├── ui/                     # shadcn-style React primitives
│   │   └── utilities/              # Static-first Astro utilities such as ThemeToggle
│   ├── config/site.ts              # Typed site-wide configuration
│   ├── layouts/Layout.astro        # Accessible header/main/footer shell
│   ├── lib/utils.ts                # cn() and base-aware asset paths
│   ├── pages/                      # Homepage, 404, and generated manifest
│   ├── styles/                     # Tailwind tokens and prose overrides
│   └── types/seo.ts                # Typed page metadata contract
├── astro.config.ts                 # Astro integrations and shared URL/base settings
├── components.json                 # shadcn/ui configuration
└── tsconfig.json
```

## 🚢 Deployment

The site builds to static output in `dist/` and works with Vercel, Netlify, Cloudflare Pages, GitHub Pages, and similar hosts.

A manual GitHub Pages workflow is included at `.github/workflows/deploy.yml`. Before using it:

1. Set `siteConfig.url` to the deployed origin.
2. Set `siteConfig.base` to the repository path when the site is not hosted at the domain root.
3. Select **GitHub Actions** as the Pages source.
4. Run the workflow manually, or enable its commented `push` trigger.

## 📄 License

[MIT](./LICENSE) — free to use, modify, and distribute.
