#!/usr/bin/env node
/**
 * Generates the full Nexus Architect brand-asset set (web + mobile) from one
 * vector source of truth: the gold pyramid on deep-navy mark (`#0A0E17`,
 * `#F59E0B`, `#FFDC82`, `#38BDF8`), rasterised with 4x4 supersampling.
 *
 * Usage:
 *   node scripts/generate-brand-assets.mjs                 # write into the monorepo
 *   node scripts/generate-brand-assets.mjs --out <dir>     # staged output (for review)
 *
 * Outputs (monorepo mode):
 *   apps/nex32scan/public/{logo.png,icon-192.png,apple-touch-icon.png,favicon.ico}
 *   apps/mobile/assets/icon.png                         (192, sign-in mark)
 *   apps/mobile/assets/images/{icon.png,android-icon-foreground.png,
 *     android-icon-monochrome.png,splash-icon.png,favicon.png}
 *
 * Pure Node (zlib only) so it runs anywhere the repo builds — no native image
 * tooling required. Deterministic: same bytes on every run/platform.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- palette ---
const NAVY = [10, 14, 23];
const GOLD = [245, 158, 11];
const CREAM = [255, 220, 130];
const SKY = [56, 189, 248];
const WHITE = [255, 255, 255];

// ------------------------------------------------- design geometry (0..1) ---
// Measured from the original 192px mark: a pyramid (apex at 0.217 of the
// canvas) whose base sits at 0.779, plus a sky-blue dot top-right.
const OUTER = { apexY: 41.6 / 192, baseY: 149.5 / 192, halfW: 67.4 / 192 };
const INNER = { apexY: OUTER.apexY, baseY: OUTER.baseY, halfW: 16.0 / 192 };
const DOT = { cx: 130 / 192, cy: 34 / 192, r: 13.5 / 192 };
/** Centre of the drawn content (pyramid base + dot bounding box). */
const CONTENT_CY = (DOT.cy + OUTER.baseY) / 2;
const CONTENT_HALF_W = OUTER.halfW;

// --------------------------------------------------------------- rasteriser -
const SS = 4; // 4x4 subsamples per pixel

/** Half-width of a triangle at height y, or -1 outside [apexY, baseY]. */
function triangleHalfWidth(tri, y) {
  if (y < tri.apexY || y > tri.baseY) return -1;
  return ((y - tri.apexY) / (tri.baseY - tri.apexY)) * tri.halfW;
}

function insideTriangle(tri, x, y) {
  const hw = triangleHalfWidth(tri, y);
  return hw >= 0 && Math.abs(x - 0.5) <= hw;
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideRoundedSquare(x, y, r) {
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - r), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - r), 0);
  return dx * dx + dy * dy <= r * r;
}

// --------------------------------------------------------------- PNG writer -
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --------------------------------------------------------------- rendering --
/**
 * @param {number} size square canvas size in px
 * @param {object} opts
 *  - backdrop: 'square' | 'rounded' | 'none'
 *  - scale / tx / ty: design transform; design point p maps to p*scale + t
 *  - monochrome: paint the whole mark in white
 */
function render(size, { backdrop, scale, tx, ty, monochrome = false }) {
  const rgba = Buffer.alloc(size * size * 4);
  const inBackdrop = backdrop === 'rounded'
    ? (x, y) => insideRoundedSquare(x, y, 0.2)
    : backdrop === 'square'
      ? () => true
      : () => false;

  const gold = monochrome ? WHITE : GOLD;
  const cream = monochrome ? WHITE : CREAM;
  const sky = monochrome ? WHITE : SKY;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let covBack = 0, covOuter = 0, covInner = 0, covDot = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (inBackdrop(x, y)) covBack++;
          const dx = (x - tx) / scale;
          const dy = (y - ty) / scale;
          if (insideTriangle(OUTER, dx, dy)) covOuter++;
          if (insideTriangle(INNER, dx, dy)) covInner++;
          if (insideCircle(dx, dy, DOT.cx, DOT.cy, DOT.r)) covDot++;
        }
      }
      const n = SS * SS;
      let r = 0, g = 0, b = 0, a = 0;
      // backdrop (navy, opaque) where the rounded/square plate is.
      const backAlpha = covBack / n;
      if (backAlpha > 0) {
        r = NAVY[0]; g = NAVY[1]; b = NAVY[2]; a = backAlpha;
      }
      // composite helper (source-over with per-shape coverage)
      const over = (colour, coverage) => {
        const ca = coverage;
        if (ca <= 0) return;
        const outA = ca + a * (1 - ca);
        if (outA <= 0) { r = g = b = a = 0; return; }
        r = (colour[0] * ca + r * a * (1 - ca)) / outA;
        g = (colour[1] * ca + g * a * (1 - ca)) / outA;
        b = (colour[2] * ca + b * a * (1 - ca)) / outA;
        a = outA;
      };
      over(gold, covOuter / n);
      over(cream, covInner / n);
      over(sky, covDot / n);

      const o = (py * size + px) * 4;
      rgba[o] = Math.round(r);
      rgba[o + 1] = Math.round(g);
      rgba[o + 2] = Math.round(b);
      rgba[o + 3] = Math.round(a * 255);
    }
  }
  return encodePng(size, size, rgba);
}

// ------------------------------------------------------------------ ICO -----
function encodeIco(entries) {
  // entries: [{ size, png }]
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dir = [];
  const blobs = [];
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e[2] = 0; // palette
    e[3] = 0;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    dir.push(e);
    blobs.push(png);
  }
  return Buffer.concat([header, ...dir, ...blobs]);
}

// -------------------------------------------------------------- variants ----
const centred = (scale) => ({
  scale,
  tx: 0.5 - scale * 0.5,
  ty: 0.5 - scale * CONTENT_CY,
});

/** name -> { dir, file, png } */
function buildSet() {
  const mark = (size, opts) => render(size, opts);
  const full = (size) => mark(size, { backdrop: 'square', scale: 1, tx: 0, ty: 0 });
  const fg = centred(0.68); // within Android's 66dp safe circle
  const splash = centred(0.94 / 0.698); // tight crop, ~3% padding

  return {
    web: [
      { file: 'logo.png', png: full(512) },
      { file: 'icon-192.png', png: full(192) },
      { file: 'apple-touch-icon.png', png: full(180) },
      {
        file: 'favicon.ico',
        png: encodeIco([16, 32, 48].map((size) => ({ size, png: full(size) }))),
      },
    ],
    mobile: [
      { dir: 'assets', file: 'icon.png', png: full(384) },
      { dir: 'assets/images', file: 'icon.png', png: full(1024) },
      {
        dir: 'assets/images',
        file: 'android-icon-foreground.png',
        png: mark(1024, { backdrop: 'none', ...fg }),
      },
      {
        dir: 'assets/images',
        file: 'android-icon-monochrome.png',
        png: mark(1024, { backdrop: 'none', ...fg, monochrome: true }),
      },
      {
        dir: 'assets/images',
        file: 'splash-icon.png',
        png: mark(1024, { backdrop: 'none', ...splash }),
      },
      { dir: 'assets/images', file: 'favicon.png', png: mark(96, { backdrop: 'rounded', ...centred(0.88) }) },
    ],
  };
}

// ------------------------------------------------------------------- main ---
function writeAll(outDir) {
  const set = buildSet();
  for (const { dir = 'web', file, png } of set.web) {
    const target = path.join(outDir, dir, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, png);
    console.log(`web     ${file.padEnd(28)} ${String(png.length).padStart(7)} bytes`);
  }
  for (const { dir, file, png } of set.mobile) {
    const target = path.join(outDir, 'mobile', dir, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, png);
    console.log(`mobile  ${path.join(dir, file).padEnd(28)} ${String(png.length).padStart(7)} bytes`);
  }
}

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
if (outIdx >= 0) {
  const outDir = path.resolve(args[outIdx + 1] ?? '');
  if (!args[outIdx + 1]) {
    console.error('--out requires a directory');
    process.exit(1);
  }
  writeAll(outDir);
  console.log(`\nStaged brand assets in ${outDir}`);
} else {
  const here = path.dirname(fileURLToPath(import.meta.url)); // apps/nex32scan/scripts
  const root = path.resolve(here, '..', '..', '..');
  const webDir = path.join(root, 'apps', 'nex32scan', 'public');
  const mobileDir = path.join(root, 'apps', 'mobile');
  const set = buildSet();
  for (const { file, png } of set.web) {
    writeFileSync(path.join(webDir, file), png);
    console.log(`web     ${file.padEnd(28)} ${String(png.length).padStart(7)} bytes`);
  }
  for (const { dir, file, png } of set.mobile) {
    const target = path.join(mobileDir, dir, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, png);
    console.log(`mobile  ${path.join(dir, file).padEnd(28)} ${String(png.length).padStart(7)} bytes`);
  }
  console.log(`\nBrand assets written into:\n  ${webDir}\n  ${mobileDir}`);
}
