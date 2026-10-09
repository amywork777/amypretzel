import { notFound } from "next/navigation";
import LogoRender from "./logo-render";

// Development only: renders the pretzel mark for scripts/render-logo.mjs to
// photograph. Never part of the built site.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <LogoRender />;
}
