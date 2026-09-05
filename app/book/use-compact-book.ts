"use client";

import { useSyncExternalStore } from "react";

const query = "(max-width: 700px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

export function useCompactBook() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
