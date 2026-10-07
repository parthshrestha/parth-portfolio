import {describe, expect, it} from 'vitest';
import {samplePortrait} from './sampler';

/** Paints a soft dot whose luminance peaks at its centre. */
function dot(gray: Uint8Array, width: number, cx: number, cy: number, r: number) {
  for (let y = 0; y < gray.length / width; y++) {
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) gray[y * width + x] = Math.round(255 * (1 - d / (r + 1)));
    }
  }
}

describe('portrait sampler', () => {
  it('finds one particle per stipple dot, with its size and left-to-right order', () => {
    const w = 48, h = 40, gray = new Uint8Array(w * h);
    dot(gray, w, 10, 12, 1.5);
    dot(gray, w, 34, 26, 3);
    const s = samplePortrait(gray, w, h);
    expect(s.count).toBe(2);
    expect(s.positions[0]).toBeCloseTo((10 - w / 2) / w, 3);
    expect(s.positions[1]).toBeCloseTo((h / 2 - 12) / w, 3);
    expect(s.positions[2]).toBe(0);
    expect(s.sizes[1]).toBeGreaterThan(s.sizes[0]);
    expect(Array.from(s.order)).toEqual([0, 1]);
    expect(s.seeds.length).toBe(8);
  });
  it('returns nothing for a blank image', () => {
    expect(samplePortrait(new Uint8Array(100), 10, 10).count).toBe(0);
  });
  it('is deterministic', () => {
    const w = 32, gray = new Uint8Array(w * w);
    dot(gray, w, 8, 8, 2);
    dot(gray, w, 20, 14, 2);
    const a = samplePortrait(gray, w, w), b = samplePortrait(gray, w, w);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    expect(Array.from(a.seeds)).toEqual(Array.from(b.seeds));
  });
});
