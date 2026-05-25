# Image Compressor

A client-side web app for compressing images and downloading them as a ZIP archive. Files are processed entirely in the browser — nothing is uploaded to a server.

**Live site:** https://image-compressor-kappa-six.vercel.app/

**[Русская версия →](README-RU.md)**

## What it does

- Compress **JPEG**, **PNG**, and **WebP** images with adjustable quality (10–100%).
- Add files via drag-and-drop, file picker, or **whole folders** — nested directory structure is preserved in the output archive.
- **Non-image files** in a folder are copied into the ZIP unchanged.
- Download a single **ZIP** with the same paths as the source selection.
- **English and Russian** UI.

## How compression works

| Format | Approach |
|--------|----------|
| JPEG / WebP | Re-encoded via Canvas with the selected quality level |
| PNG | Color quantization at lower quality, then **oxipng** optimization; at 100% only lossless optimization is applied |

If compression would not reduce file size, the original file is kept.

## Tech stack

- [Nuxt 4](https://nuxt.com) + Vue 3
- [@jsquash/oxipng](https://github.com/jamsinclair/jsquash) — PNG optimization in the browser
- [JSZip](https://stuk.github.io/jszip/) — archive generation
- [Sharp](https://sharp.pixelplumbing.com/) — optional compression of static assets at build time

The app is built as a **static site** (`nuxt generate`) and can be deployed to Vercel or any static host.

## Setup

Install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development

Start the dev server at `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build for production (output goes to `dist/`):

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Preview the production build locally:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

See the [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment) for hosting options.
