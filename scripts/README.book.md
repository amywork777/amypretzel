# Scene and project previews

The book posters in `public/book/` are captures of the actual WebGL scene. They paint while its JavaScript and shaders initialize, then fade after the first rendered frame. They are not an alternative interactive book.

After changing the scene or camera, build and start a local production server on port 3001, run `node scripts/capture-book-posters.mjs`, inspect both images, and rebuild before deploying. `BOOK_PREVIEW_URL` and `BROWSER_CHANNEL` override the default local URL and installed Chrome channel.

Software previews are genuine screenshots, captured September 4, 2026:

- `public/software/tech-pack.webp`: https://techpack-ten.vercel.app
- `public/software/sf-rats.webp`: https://sfrats-map.vercel.app (map attribution retained)
- `public/software/cute-ghostty.webp`: https://cute-ghostty.vercel.app
- Taiyaki uses the existing `public/portfolio/taiyaki-3d/image.png`.

Homepage images use the same grid component for objects and software; keep both categories' frame sizes, headings, captions and index links equivalent.
