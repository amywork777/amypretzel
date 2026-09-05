# Scene and project previews

The book posters in `public/book/` are captures of the actual WebGL scene. They paint while its JavaScript and shaders initialize, then fade after the first rendered frame. They are not an alternative interactive book.

After changing the scene or camera, build and start a local production server on port 3001, run `node scripts/capture-book-posters.mjs`, inspect both images, and rebuild before deploying. `BOOK_PREVIEW_URL` and `BROWSER_CHANNEL` override the default local URL and installed Chrome channel.

Objects use the image grid. Software uses compact, grouped text links on the homepage and software index. Keep their section headings and index links consistent; the software list intentionally has no preview images. Tech Pack and Kerf are excluded from the public project data.

The coffee cup and saucer use `public/book/coffee-cup.glb`, adapted from the CC0 Poly Haven / Eric Chadwick teacup in the Khronos sample collection. Source and modification details are in `public/book/coffee-cup.LICENSE.md`. Its handle is joined to the cup body, and its coffee surface is fitted to the interior rather than laid over the rim.

Table props respond to direct taps and drags. The cup and saucer remain separate during tipping; each flower lifts clear of the vase before laying down, and returns along the reverse path. Standing the cup up leaves it empty. “Reset table” restores all flowers, cleans the spill, and refills the cup. The collapsed “Play with the table” controls provide the same actions from a keyboard.

Run `node scripts/verify-table-interactions.mjs` against the production server on port 3001 to check desktop drags, mobile taps, individual flower state, cancellation, reset, page turning, reduced motion, browser errors, and zero idle draw calls. Screenshots go to the system temporary directory (`BOOK_QA_DIR` overrides it). Inspect the open-book and phone screenshots as well as the assertions: a prop's final position can clip outside the camera even when its interaction passes.
