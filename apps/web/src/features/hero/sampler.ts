import {seeded} from '../../experience/timeline';

export interface PortraitSample {
  count: number;
  /** x, y, 0 per point. Image-relative: (0, 0) at the centre, +y up, ±0.5 at the edges of the longer side. */
  positions: Float32Array;
  /** Dot radius in source pixels. */
  sizes: Float32Array;
  /** 0 at the left edge of the sampled head, 1 at the right edge. */
  order: Float32Array;
  /** Four deterministic randoms in [0, 1) per point. */
  seeds: Float32Array;
}

export interface SampleOptions {
  /** Minimum smoothed luminance (0..1) for a dot. */
  threshold?: number;
  /** Non-maximum suppression radius in pixels; roughly half the dot spacing. */
  radius?: number;
}

/**
 * Turns a dotted (stippled) portrait into one particle per dot. Each dot is a local maximum of the
 * 3×3-smoothed luminance; its size comes from the luminance mass in the surrounding 5×5 window, so the
 * halftone shading of the artwork survives. Output order is raster order and fully deterministic.
 */
export function samplePortrait(gray: ArrayLike<number>, width: number, height: number, {threshold = 0.2, radius = 2}: SampleOptions = {}): PortraitSample {
  const blurred = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += gray[(y + dy) * width + x + dx];
      blurred[y * width + x] = sum / (9 * 255);
    }
  }
  const xs: number[] = [], ys: number[] = [], mass: number[] = [];
  const margin = Math.max(radius, 2);
  for (let y = margin; y < height - margin; y++) {
    for (let x = margin; x < width - margin; x++) {
      const i = y * width + x, v = blurred[i];
      if (v < threshold || !isPeak(blurred, i, width, radius, v)) continue;
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) sum += gray[(y + dy) * width + x + dx];
      xs.push(x);
      ys.push(y);
      mass.push(sum / 255);
    }
  }
  const count = xs.length;
  const positions = new Float32Array(count * 3), sizes = new Float32Array(count), order = new Float32Array(count), seeds = new Float32Array(count * 4);
  const side = Math.max(width, height);
  let minX = Infinity, maxX = -Infinity;
  for (const x of xs) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const span = Math.max(1, maxX - minX);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (xs[i] - width / 2) / side;
    positions[i * 3 + 1] = (height / 2 - ys[i]) / side;
    sizes[i] = 0.6 * Math.sqrt(mass[i]);
    order[i] = (xs[i] - minX) / span;
    for (let k = 0; k < 4; k++) seeds[i * 4 + k] = seeded(i * 4 + k);
  }
  return {count, positions, sizes, order, seeds};
}

/** Strict against later raster neighbours, non-strict against earlier ones: one winner per plateau. */
function isPeak(field: Float32Array, i: number, width: number, radius: number, v: number) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (!dx && !dy) continue;
      const u = field[i + dy * width + dx];
      const later = dy > 0 || (dy === 0 && dx > 0);
      if (later ? v <= u : v < u) return false;
    }
  }
  return true;
}
