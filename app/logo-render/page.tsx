import { notFound } from "next/navigation";
import LogoRender from "./logo-render";

// Development only: renders the pretzel mark for scripts/render-logo.mjs to
// photograph. Never part of the built site. ?kind=secret renders the stray pretzel.
export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { kind } = await searchParams;
  return <LogoRender kind={kind === "secret" ? "secret" : "logo"} />;
}
