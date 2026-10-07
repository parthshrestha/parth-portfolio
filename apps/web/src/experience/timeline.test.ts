import {describe, expect, it, vi} from 'vitest';
import {particle, schedule, seeded, stages} from './timeline';
import {bundled, refreshContent, schema} from '../services/content';

/** A spread of particle identities: horizontal order × the two seeds the schedule uses. */
const identities = () => {
  const out: [number, number, number][] = [];
  for (let order = 0; order <= 1; order += 0.05) for (let a = 0; a <= 1; a += 0.25) for (let b = 0; b <= 1; b += 0.25) out.push([order, a, b]);
  return out;
};

describe('reversible scroll', () => {
  it('holds the intact face until the sweep starts', () => {
    for (const [o, a, b] of identities()) expect(particle(schedule.start, o, a, b)).toEqual({flight: 0, alpha: 1});
  });
  it('has every particle flown and invisible by the end', () => {
    for (const [o, a, b] of identities()) expect(particle(schedule.fadeEnd, o, a, b)).toEqual({flight: 1, alpha: 0});
    expect(particle(1, 0.5, 0.5, 0.5).alpha).toBe(0);
  });
  it('sweeps from the left edge of the head to the right edge', () => {
    const midway = schedule.start + schedule.sweep / 2;
    expect(particle(midway, 0).flight).toBe(1);
    expect(particle(midway, 1).flight).toBe(0);
  });
  it('never moves a particle backwards while scrolling forwards', () => {
    for (const [o, a, b] of identities()) {
      let last = 0;
      for (let p = 0; p <= 1; p += 0.01) {
        const {flight} = particle(p, o, a, b);
        expect(flight).toBeGreaterThanOrEqual(last);
        last = flight;
      }
    }
  });
  it('is a pure function of progress, so scrolling back retraces the same states', () => {
    const forward = [0, 0.2, 0.4, 0.6, 0.8, 1].map(p => particle(p, 0.4, 0.3, 0.7));
    const backward = [1, 0.8, 0.6, 0.4, 0.2, 0].map(p => particle(p, 0.4, 0.3, 0.7)).reverse();
    expect(backward).toEqual(forward);
    expect(seeded(20)).toBe(seeded(20));
  });
  it('drives the HTML content from the same value', () => {
    expect(stages(0)).toEqual({intro: 1, cue: 1, cards: 0});
    expect(stages(1)).toEqual({intro: 0, cue: 0, cards: 1});
  });
});

describe('content safety', () => {
  it('rejects incompatible schemas', () => {
    expect(() => schema.parse({...bundled, schemaVersion: 2})).toThrow();
  });
  it('keeps bundled content usable during an API outage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Error('offline')));
    await expect(refreshContent()).rejects.toThrow();
    expect(bundled.projects.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
});
