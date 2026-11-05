// ABC Areal's licence doesn't allow the font in a public repository, so the file
// isn't committed. This runs before `next build` and pulls it into public/fonts
// from private storage. Without AREAL_FONT_URL the build carries on and the site
// falls back to Arial, sized to match, so forks still build.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const target = new URL("../public/fonts/areal.woff2", import.meta.url);
const url = process.env.AREAL_FONT_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN;

if (existsSync(target)) process.exit(0);

if (!url) {
  console.warn("AREAL_FONT_URL isn't set, so the site will build with its Arial fallback.");
  process.exit(0);
}

// A bad URL must fail the build: otherwise production quietly loses its font.
const response = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
if (!response.ok) throw new Error(`Couldn't fetch ABC Areal: HTTP ${response.status}`);

const font = Buffer.from(await response.arrayBuffer());
if (font.subarray(0, 4).toString("latin1") !== "wOF2") throw new Error("AREAL_FONT_URL didn't return a WOFF2 file");

mkdirSync(new URL(".", target), { recursive: true });
writeFileSync(target, font);
console.log(`Fetched ABC Areal (${font.length} bytes).`);
