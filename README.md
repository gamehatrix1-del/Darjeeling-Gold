# Darjeeling Gold — storefront demo

Scroll-story hero + e-commerce storefront (placeholder brand, products and reviews).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site -> dist/
npm run preview
npm run frames     # regenerate frames from assets/raw-video.mp4 (needs ffmpeg + cwebp)
```

- Stack: Vite + TypeScript, Lenis (smooth scroll), GSAP ScrollTrigger. Fonts (Playfair Display, Inter) are self-hosted.
- Brand/pricing config: `src/store/brand.ts`, catalog: `src/store/products.ts`, story copy: `src/data/story-steps.json`.
- Frames: `public/frames` (1920px) and `public/frames-md` (1280px); the browser picks one in `index.html`.
- The built `dist/` is plain static files — drop it on any static host (Netlify, Vercel, S3, GitHub Pages).
