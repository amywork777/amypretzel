// Makes the pictures for objects from their covers and lead shots:
//   public/thumbs/<slug>.webp       4:3 list thumbnail, from the cover
//   public/thumbs/<slug>-lead.webp  16:9 lead shot, from gallery[0], cut-outs only
// Cut-outs (a product on white) are trimmed to the product and re-centred on
// white, so a pendant fills its frame instead of being a speck in a wide
// render. Photos are cropped to 4:3 for the list and shown as they are on the
// page. Writes app/portfolio/thumbs.json, which records which pictures are
// cut-outs (those get multiplied onto the media tone). Run after adding or
// changing an object's cover or first gallery image:
//   node scripts/make-thumbs.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = await fs.readFile(path.join(root, "app/portfolio/projects.ts"), "utf8");
const covers = [...src.matchAll(/slug: "([^"]+)",[\s\S]*?cover: "([^"]+)",[\s\S]*?gallery: \[\s*"([^"]+)"/g)]
  .map(m => ({ slug: m[1], cover: m[2], lead: m[3] }));

const MARGIN = 0.1, LEAD_MARGIN = 0.12;

/* Trims a picture's white border. Returns null for a photo, which loses little
   or nothing when trimmed; a cut-out loses a lot of white. */
async function trimmed(file) {
  const meta = await sharp(file).metadata();
  const { data, info } = await sharp(file).flatten({ background: "#fff" }).trim({ background: "#fff", threshold: 18 }).toBuffer({ resolveWithObject: true });
  const kept = (info.width * info.height) / (meta.width * meta.height);
  return { kept, buffer: kept < 0.8 ? data : null };
}

/* A trimmed cut-out centred on white in a W x H frame. */
async function placeOnWhite(buffer, W, H, margin, out) {
  const inner = { width: Math.round(W * (1 - 2 * margin)), height: Math.round(H * (1 - 2 * margin)) };
  const fitted = await sharp(buffer).resize({ ...inner, fit: "inside" }).toBuffer();
  await sharp({ create: { width: W, height: H, channels: 3, background: "#fff" } })
    .composite([{ input: fitted, gravity: "center" }]).webp({ quality: 86 }).toFile(out);
}

await fs.mkdir(path.join(root, "public/thumbs"), { recursive: true });
const manifest = {};

for (const { slug, cover, lead } of covers) {
  const coverFile = path.join(root, "public", cover);
  const c = await trimmed(coverFile);
  const out = path.join(root, "public/thumbs", `${slug}.webp`);
  if (c.buffer) await placeOnWhite(c.buffer, 640, 480, MARGIN, out);
  else await sharp(coverFile).flatten({ background: "#fff" }).resize({ width: 640, height: 480, fit: "cover" }).webp({ quality: 82 }).toFile(out);

  const l = lead === cover ? c : await trimmed(path.join(root, "public", lead));
  if (l.buffer) await placeOnWhite(l.buffer, 1600, 900, LEAD_MARGIN, path.join(root, "public/thumbs", `${slug}-lead.webp`));

  manifest[slug] = { cutout: Boolean(c.buffer), leadCutout: Boolean(l.buffer) };
  console.log(`${slug.padEnd(28)} cover ${c.buffer ? "cut-out" : "photo  "} ${(c.kept * 100).toFixed(0).padStart(3)}%   lead ${l.buffer ? "cut-out" : "photo  "} ${(l.kept * 100).toFixed(0).padStart(3)}%`);
}

await fs.writeFile(path.join(root, "app/portfolio/thumbs.json"), JSON.stringify(manifest, null, 2) + "\n");
