/** Shared, low-frequency experience state. Per-frame values are written here, never through React state. */
export const experience = {progress: 0, heroComplete: false, avatarEnabled: false, invalidate: () => {}, /** rendered hero frames, for diagnostics */ frames: 0};

export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Deterministic pseudo-random in [0, 1) for a particle index. Stable across frames, resizes and reloads. */
export function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Scroll schedule for the dispersal. Every value is hero progress in 0..1. The canvas renderer and tests
 * call the same particle function, keeping the animation timeline consistent.
 *
 *   start .. start+sweep   the departure front crosses the head from its left edge to its right edge
 *   jitter                 per-particle randomness on the departure, keeps the front ragged
 *   minDuration..+spread   how much scroll one particle spends in flight
 *   fadeStart .. fadeEnd   global safety fade; nothing survives past fadeEnd
 */
export const schedule = {
  start: 0.12,
  sweep: 0.5,
  jitter: 0.1,
  minDuration: 0.16,
  durationSpread: 0.08,
  fadeStart: 0.85,
  fadeEnd: 0.97,
} as const;

export function departure(order: number, seed: number) {
  return schedule.start + order * schedule.sweep + seed * schedule.jitter;
}
export function flightDuration(seed: number) {
  return schedule.minDuration + seed * schedule.durationSpread;
}
/**
 * Pure per-particle state for progress `p`. `order` is 0 at the left edge of the head and 1 at the right,
 * `seedA`/`seedB` are the particle's fixed randoms. Used directly by the canvas renderer.
 */
export function particle(p: number, order: number, seedA = 0, seedB = 0) {
  const flight = clamp((p - departure(order, seedA)) / flightDuration(seedB));
  const alpha = (1 - smooth(0.55, 1, flight)) * (1 - smooth(schedule.fadeStart, schedule.fadeEnd, p));
  return {flight, alpha};
}
/** HTML content transitions, driven by the same progress value as the particles. */
export function stages(p: number) {
  return {intro: 1 - smooth(0.1, 0.35, p), cue: 1 - smooth(0.04, 0.2, p), cards: smooth(0.28, 0.7, p)};
}
