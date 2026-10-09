let pending: Promise<typeof import("./book")> | undefined;

// The pages are printed onto canvas textures once, so Areal has to be ready
// first or they would be printed in the fallback face.
function loadPrintFonts() {
  return Promise.all([document.fonts.load("400 42px Areal"), document.fonts.load("600 78px Areal")])
    .catch(() => { /* Print in the fallback face rather than not open the book. */ });
}

export function loadBook() {
  pending ??= Promise.all([import("./book"), loadPrintFonts()])
    .then(([book]) => book)
    .catch(error => { pending = undefined; throw error; });
  return pending;
}

export function preloadBook() {
  // Wait until a phone visitor opens the book before downloading WebGL.
  if (window.matchMedia("(max-width: 700px)").matches) return;
  void loadBook().catch(() => { /* Opening the book can retry a failed preload. */ });
}
