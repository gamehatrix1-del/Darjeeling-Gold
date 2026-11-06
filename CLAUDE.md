# Project notes

Single-page site (Vite + TypeScript): `/` (`index.html`) is the "Darjeeling Gold" storefront (placeholder brand, see
`src/store/brand.ts`) — a scroll-story hero followed by an e-commerce shop. Lenis smooth scroll + GSAP ScrollTrigger.

## Hero scroll-story architecture
- `scripts/extract-frames.sh` turns `assets/raw-video.mp4` into `public/frames/frame_0001..0240.webp`
  (24fps, crops the generator watermark, needs `cwebp`).
- `src/utils/CanvasScroller.ts` — canvas frame scrubber (never seek `<video>`): preloads first 24 frames,
  streams the rest, draws nearest loaded frame, DPR-aware, `view.offsetX` shifts the teapot away from text.
- `src/tea/main.ts` — pins `.scrolly-viewport` for 500vh, builds text stages from `public/data/story-steps.json`,
  crossfades to `public/img/ripple.webp` for the pour/ritual stages.
- Tokens in `src/styles/tokens.css`; page styles in `src/styles/tea.css`.
- Story copy and scroll windows live only in `story-steps.json`.

## Storefront (src/store)
- `products.ts` catalog + prices (INR) · `cart.ts` cart/wishlist/promo state (localStorage) · `ui.ts` grid, quick view,
  cart drawer, search, mobile menu, toasts, form validation (native `<dialog>`) · `tin.ts` vector tea-tin art · `icons.ts` SVG icons.
- Styles: `src/styles/shop.css` (light theme tokens in `tokens.css`). Reduced motion => static, unpinned story (see `main.ts`).
- Frames are 1920x1080 (lanczos + unsharp) for crispness; text uses `transform:none` at rest to avoid sub-pixel blur.
- Demo data only: reviews, ratings, stock and the checkout button are placeholders.

## Boot loader
`#loader` (index.html) blocks the page until ALL frames + story images + fonts are fetched (progress bar, scroll locked,
Skip button after 8 s, hard cap 30 s). Frames are fetched coarse-to-fine, 10 in parallel (`CanvasScroller.preload`) and
frames around the playhead are pre-decoded (`warm`). Reduced-motion users skip it (static story).
