import { openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";

/** Width and height of a PNG or WebP under public/, read from its header at
    build time so a gallery can hold each photo's shape before it loads.
    Falls back to 4:3 for anything it can't read. */
export function imageSize(src: string): { width: number; height: number } {
  const fallback = { width: 1600, height: 1200 };
  if (!src.startsWith("/")) return fallback;
  let fd: number | undefined;
  try {
    fd = openSync(join(process.cwd(), "public", src), "r");
    const b = Buffer.alloc(32);
    readSync(fd, b, 0, 32, 0);
    // PNG: IHDR width and height, big-endian, at 16 and 20.
    if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
      const chunk = b.toString("ascii", 12, 16);
      // Lossy: 14-bit width and height after the frame tag.
      if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      // Lossless: 14-bit width-1 and height-1 packed after the 0x2f signature.
      if (chunk === "VP8L") {
        const v = b.readUInt32LE(21);
        return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 };
      }
      // Extended: 24-bit canvas width-1 and height-1.
      if (chunk === "VP8X") return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    }
  } catch {
    // A missing or unreadable file keeps the fallback.
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  return fallback;
}
