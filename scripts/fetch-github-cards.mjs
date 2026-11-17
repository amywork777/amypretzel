// Saves the GitHub card for every repo a project links to, as
// public/github/<owner>-<repo>.png. Pages show the saved card instead of
// loading it from GitHub on every visit: GitHub renders a card on first
// request and that can time out, which left a broken image on the page.
// Run after adding a GitHub link (cards are committed):
//   node scripts/fetch-github-cards.mjs          only fetches missing cards
//   node scripts/fetch-github-cards.mjs --all    refreshes every card (star counts)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const sources = ["app/software/projects.ts", "app/portfolio/projects.ts"].map(f => readFileSync(new URL(f, root), "utf8")).join("\n");
const repos = [...new Set([...sources.matchAll(/https:\/\/github\.com\/([^/"?#\s]+)\/([^/"?#\s]+)\/?"/g)].map(m => `${m[1]}/${m[2]}`))];
const refresh = process.argv.includes("--all");

mkdirSync(new URL("public/github/", root), { recursive: true });
let failed = 0;
for (const repo of repos) {
  const file = new URL(`public/github/${repo.replace("/", "-")}.png`, root);
  if (existsSync(file) && !refresh) continue;
  // GitHub renders the card lazily; a second try usually gets it.
  let saved = false;
  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    try {
      const res = await fetch(`https://opengraph.githubassets.com/1/${repo}`, { signal: AbortSignal.timeout(20000) });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) throw new Error(`${res.status} ${type}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      saved = true;
      console.log(`saved ${repo}`);
    } catch (err) {
      if (attempt === 2) { failed++; console.warn(`couldn't fetch the card for ${repo}: ${err.message}`); }
    }
  }
}
// Never fail the build over a card: the page falls back to GitHub's own URL.
if (failed) console.warn(`${failed} card(s) missing; those pages load the card from GitHub instead.`);
