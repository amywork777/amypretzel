let pending: Promise<typeof import("./book")> | undefined;

export function loadBook() {
  pending ??= import("./book").catch(error => { pending = undefined; throw error; });
  return pending;
}

export function preloadBook() {
  void loadBook().catch(() => { /* Opening the book can retry a failed preload. */ });
}
