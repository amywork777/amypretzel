# Scene and project previews

The book posters in `public/book/` are captures of the actual WebGL scene. They paint while its JavaScript and shaders initialize, then fade after the first rendered frame. They are not an alternative interactive book.

After changing the scene or camera, build and start a local production server on port 3001, run `node scripts/capture-book-posters.mjs`, inspect both images, and rebuild before deploying. `BOOK_PREVIEW_URL` and `BROWSER_CHANNEL` override the default local URL and installed Chrome channel.

Objects use the image grid. Software uses compact, grouped text links on the homepage and software index. Keep their section headings and index links consistent; the software list intentionally has no preview images. Tech Pack and Kerf are excluded from the public project data.

The coffee cup and saucer use `public/book/coffee-cup.glb`, adapted from the CC0 Poly Haven / Eric Chadwick teacup in the Khronos sample collection. Source and modification details are in `public/book/coffee-cup.LICENSE.md`. Its handle is joined to the cup body, and its coffee surface is fitted to the interior rather than laid over the rim.

The book is a short life story, one chapter to a page, in `app/book/chapters.ts`. It ends with a goodbye and a blank spread to draw on, and every printed page also takes the pencil. Amy asked for no product photos in the book; illustrations, if they come back, should be pencil sketches. Opening the book glides the camera close and nearly overhead so the pages read like a real book; phones read one page at a time.

Table props respond to direct taps and drags. "Spill coffee" and "Take a pretzel" buttons sit top left, opposite "Exit the book", and "Reset the table" appears once something has changed. The pencil is picked up by tapping it; while it is held, the first Escape puts it down and the second leaves the book.

The book opens by itself only on a first desktop visit (`localStorage['amypretzel:book-seen']`); after that the homepage is the homepage, including when Home is clicked from a project. Explicit section links keep their destination, and the Book link or `/#book` opens the book on either device. Phones (700px and below) start on the normal website.

On phones, opening the book loads the interactive 3D table directly. Avoid preloading WebGL on phone link focus or pointer entry. Phones render at their own pixel density (up to 2) with 768×1024 page textures, 512px shadows and simple transparent glass, because they read the page up close. Desktop pages use 900×1200 textures.

The main site uses system fonts. Keep the fishing page's Silkscreen font scoped to its own layout; the old root font declarations caused a throttled mobile visit to request about 1.27 MB of unused fonts. Use word labels for navigation, with no arrow glyphs.

Run `node scripts/verify-book.mjs` against the production server on port 3001 to check the first-visit rule, page turning and announcements on desktop and phones, the coffee and pretzel buttons, Exit the book, and Read as text. Screenshots go to the system temporary directory (`BOOK_QA_DIR` overrides it); inspect them as well as the assertions.
