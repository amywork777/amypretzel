# amypretzel

The source of [amypretzel.com](https://amypretzel.com), Amy Zhou's site: objects, and software to build objects. It's a Next.js app, and the pretzels are React Three Fiber.

```bash
npm install
npm run dev
```

The design system is written down in [DESIGN.md](DESIGN.md).

## The font

The site is set in [ABC Areal](https://abcdinamo.com/free/areal) by Dinamo. Its licence doesn't allow the font in a public repository, so it isn't in this one, and you'll need your own copy if you want it. Without the file the site uses Arial, sized to match.

To use Areal, put `areal.woff2` in `public/fonts/`, or set `AREAL_FONT_URL` and the build will fetch it (see `scripts/fetch-font.mjs`).

## Using this code

There's no open source licence here. The code is public to read and learn from, and the photos, writing and project work are Amy's. The 3D models that used to be on the site keep their own licences, recorded beside them in the history.
