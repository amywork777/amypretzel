// Saves the details of every repo a project links to (its description,
// stars and language) to public/github/repos.json, which the repo rows on
// project pages read (app/lib/embeds.tsx), so a page never waits on GitHub.
// Runs before every build; a repo GitHub won't answer for keeps what was
// saved before, and the build never fails over it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const sources = ["app/software/projects.ts", "app/portfolio/projects.ts"].map(f => readFileSync(new URL(f, root), "utf8")).join("\n");
const repos = [...new Set([...sources.matchAll(/https:\/\/github\.com\/([^/"?#\s]+)\/([^/"?#\s]+)\/?"/g)].map(m => `${m[1]}/${m[2]}`))];
const dataFile = new URL("public/github/repos.json", root);
const data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, "utf8")) : {};
for (const repo of repos) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers: { accept: "application/vnd.github+json", "user-agent": "amypretzel-site-build" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(String(res.status));
    const r = await res.json();
    data[repo] = { description: r.description ?? "", stars: r.stargazers_count ?? 0, language: r.language ?? "" };
  } catch (err) {
    console.warn(`couldn't read ${repo} from GitHub: ${err.message}`);
  }
}
writeFileSync(dataFile, JSON.stringify(data, null, 2) + "\n");

