# ComicK (comick.so) — Minimal Paperback 0.8 Repo

This is a stripped-down repo that includes **only one source**: ComicK, pointing to **https://comick.so**.

## How to use

1. **Install tools**
   - Node.js (LTS) + npm
   - Git
   - VS Code (optional)

2. **Install deps & build**
   ```bash
   npm install
   npm run build
   ```

3. **Host**
   - Push to GitHub and enable **GitHub Pages** (deploy from `main` or from `dist/` with a workflow you prefer).
   - Open your GitHub Pages URL on iPhone → tap **Add to Paperback**.

## Customize selectors

The selectors in `src/sources/ComicK/index.ts` are conservative defaults. Inspect comick.so's DOM and update:
- Title selector
- Chapter list selector
- Image extraction (img tags or JSON in scripts)

> If comick.so changes its HTML or uses anti-bot protections, you may need to tweak requests/headers or adjust selectors.

## Manifest

`manifest.json` already contains only this one source. If you fork, update the `repo.author` and source author fields.
