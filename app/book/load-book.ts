let pending: Promise<typeof import("./pretzel-story")> | undefined;

export function loadBook() {
  pending ??= import("./pretzel-story").catch(error => { pending = undefined; throw error; });
  return pending;
}

export function preloadBook() {
  // Wait until a phone visitor opens the pretzels before downloading WebGL.
  if (window.matchMedia("(max-width: 700px)").matches) return;
  void loadBook().catch(() => { /* Opening them can retry a failed preload. */ });
}
