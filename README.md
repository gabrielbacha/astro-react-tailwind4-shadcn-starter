# Astro Coming Soon Template

A minimal, animated "coming soon" landing page built with Astro, React, and Tailwind CSS. Features a glitching wordmark, a rotating scramble-text tagline, an email capture form, and a hidden `/egg` easter-egg terminal.

## ✨ Features

- **Glitching wordmark** — PowerGlitch-driven chromatic distortion on the hero title
- **Scramble text** — a React component that cycles through tagline phrases, decoding each character-by-character
- **Animated background** — floating, blurred circles
- **Email capture** — a styled form that submits to a Google Form via a hidden iframe (no backend required)
- **Hidden easter egg** — a full-screen scramble/glitch terminal at `/egg`
- **SEO ready** — OpenGraph, Twitter cards, JSON-LD structured data, auto-generated sitemap and `robots.txt`
- **Dark mode** — defaults to dark, shadcn/ui-style neutral palette
- **TypeScript** — strict mode throughout

## 🎨 Tech Stack

- **Framework:** [Astro](https://astro.build) 7.x
- **UI:** [React](https://react.dev) 19.x (via `@astrojs/react`)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) 4.x (CSS-first `@theme` config, no `tailwind.config.js`)
- **Components:** [shadcn/ui](https://ui.shadcn.com) ("new-york" style)
- **Fonts:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) via [Fontsource](https://fontsource.org) (self-hosted, open-source)
- **Animations:** custom CSS keyframes, [Motion](https://motion.dev), [PowerGlitch](https://powerglitch.com)
- **Icons:** [Lucide](https://lucide.dev) / [astro-icon](https://github.com/natemoo-re/astro-icon)
- **Package manager:** [pnpm](https://pnpm.io)

## 🚀 Quick Start

### Prerequisites

- **Node.js** (latest LTS recommended)
- **pnpm** — install with `npm install -g pnpm`

### Setup

```bash
# 1. Clone (replace with your repo URL)
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 2. Install dependencies
pnpm install

# 3. Start the dev server
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

### Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the dev server with hot reloading |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` / `pnpm lint:fix` | Run oxlint |
| `pnpm format` / `pnpm format:fix` | Check/fix formatting with oxfmt |
| `pnpm typecheck` | Run `astro check` |
| `pnpm check` | Format + lint + typecheck |

## ⚙️ Configuration

Almost everything you need to change lives in **`src/config/globals.js`**:

```js
export const globals = {
	gtmId: "",                          // TODO: Google Tag Manager container ID (e.g. "GTM-XXXXXXX")
	socialMedia: {
		instagram: "#",                 // TODO: your Instagram URL
		twitter: "#",                   // TODO: your Twitter/X URL
	},
	siteName: "Your Brand",             // shown in navbar, footer, SEO, JSON-LD
	siteUrl: "https://example.com",     // used for canonical URLs, sitemap, robots.txt
};
```

Also set the canonical site URL in **`astro.config.ts`** (`site:` field) — this drives `@astrojs/sitemap` and `astro-robots-txt`.

### Email form (`src/components/forms/EmailForm.astro`)

The form posts to a Google Form (no backend). To wire up your own:

1. Create a Google Form with a single **email** question
2. Open the form's prefilled-link dialog and copy the URL
3. Read the form ID (in the path) and the entry ID (`entry.XXXXX` in the query string)
4. Set them in the script at the bottom of `EmailForm.astro`

### Branding assets (`public/`)

Placeholder assets are generated from `public/favicon.svg`. To use your own:

- Replace `public/favicon.svg` and regenerate the PNGs (16, 32, 96, 180, 192, 512) + `favicon.ico` + `og-image.png`
- Update `public/site.webmanifest` (`name`, `short_name`, theme color)

### Copy & wordmark

- **Hero wordmark:** reads `globals.siteName` (see `src/pages/index.astro`)
- **Tagline phrases:** the `Scramble` `phrases` array in `src/pages/index.astro`
- **Easter-egg message:** the `LINES` array in `src/components/effects/EggTerminal.tsx`

### Theme & fonts

- **Colors:** shadcn-style neutral palette in `src/styles/global.css` (`:root` for light, `.dark` for dark; the site defaults to dark via `class="dark"` on `<html>` in `Layout.astro`)
- **Font:** JetBrains Mono is imported in `src/components/head-nav-footer/CustomFont.astro`. Swap the Fontsource package to change the typeface (also referenced by `--font-sans` / `--font-mono` and `.logo-font` in `global.css`)

## 🏗️ Project Structure

```
.
├── public/                      # Static assets (favicons, og-image, manifest)
├── src/
│   ├── components/
│   │   ├── backgrounds/         # Animated background components
│   │   ├── effects/             # Glitch, scramble, and the egg terminal
│   │   ├── forms/               # Email capture form
│   │   ├── head-nav-footer/     # <head>, navbar, footer, font loader
│   │   └── ui/                  # shadcn/ui primitives (Button)
│   ├── config/globals.js        # ← site name, URL, socials, GTM id
│   ├── layouts/Layout.astro     # Base layout
│   ├── lib/utils.ts             # cn(), getAssetPath(), date helpers
│   ├── pages/
│   │   ├── index.astro          # Homepage
│   │   ├── egg.astro            # Hidden easter-egg terminal
│   │   └── 404.astro            # Not-found page
│   └── styles/global.css        # Tailwind theme tokens + custom utilities
├── astro.config.ts              # ← site URL + integrations
├── components.json              # shadcn/ui config
└── tsconfig.json
```

## 🚢 Deployment

A GitHub Pages workflow is included at `.github/workflows/deploy.yml`. To enable automatic deploys, uncomment the `push` trigger. The workflow uses [`withastro/action`](https://github.com/withastro/action) and auto-detects pnpm from the lockfile — no further config needed.

The site builds to fully static output, so it deploys anywhere: Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.

## 📄 License

[MIT](./LICENSE) — free to use, modify, and distribute.
