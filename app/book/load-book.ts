let pending: Promise<typeof import("./book")> | undefined;

export function loadBook() {
  pending ??= import("./book").catch(error => { pending = undefined; throw error; });
  return pending;
}

export function preloadBook() {
  // Phone readers do not need WebGL until they explicitly explore the table.
  if (window.matchMedia("(max-width: 700px)").matches) return;
  void loadBook().catch(() => { /* Opening the book can retry a failed preload. */ });
}
