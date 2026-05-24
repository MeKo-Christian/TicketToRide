import { describe, expect, it } from 'vitest';
import { createRng } from './rng.js';

describe('createRng', () => {
  it('produces deterministic floats in [0, 1) for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 5 }, () => a.next());
    const ys = Array.from({ length: 5 }, () => b.next());
    expect(xs).toEqual(ys);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(1).next();
    const b = createRng(2).next();
    expect(a).not.toBe(b);
  });

  it('shuffles deterministically and preserves elements', () => {
    const a = createRng(7);
    const b = createRng(7);
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const s1 = a.shuffle([...xs]);
    const s2 = b.shuffle([...xs]);
    expect(s1).toEqual(s2);
    expect([...s1].sort((p, q) => p - q)).toEqual(xs);
  });
});
