import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const PUBLIC = new URL('../../public/', import.meta.url);
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function read(name: string): Buffer {
  return readFileSync(new URL(name, PUBLIC));
}

/** Validates the PNG signature + IHDR and returns the pixel size. */
function pngSize(buffer: Buffer): { width: number; height: number } {
  expect([...buffer.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
  expect(buffer.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('brand assets', () => {
  it('ships the explorer icon set at its declared sizes', () => {
    expect(pngSize(read('logo.png'))).toEqual({ width: 512, height: 512 });
    expect(pngSize(read('icon-192.png'))).toEqual({ width: 192, height: 192 });
    expect(pngSize(read('apple-touch-icon.png'))).toEqual({ width: 180, height: 180 });
  });

  it('every manifest icon size matches the real PNG behind it', () => {
    const manifest = JSON.parse(read('manifest.webmanifest').toString('utf8')) as {
      icons: Array<{ src: string; sizes: string; type: string }>;
    };
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      const [width, height] = icon.sizes.split('x').map(Number);
      expect(pngSize(read(icon.src.replace(/^\//, '')))).toEqual({ width, height });
      expect(icon.type).toBe('image/png');
    }
  });

  it('favicon.ico is a real multi-size ICO with PNG entries', () => {
    const ico = read('favicon.ico');
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // icon resource type
    const count = ico.readUInt16LE(4);
    expect(count).toBe(3);

    const sizes: number[] = [];
    for (let index = 0; index < count; index++) {
      const entry = 6 + index * 16;
      const width = ico.readUInt8(entry);
      const height = ico.readUInt8(entry + 1);
      expect(height).toBe(width);
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      expect(offset + length).toBeLessThanOrEqual(ico.length);
      expect(pngSize(ico.subarray(offset, offset + length))).toEqual({ width, height });
      sizes.push(width);
    }
    expect(sizes).toEqual([16, 32, 48]);
  });
});
