export interface Rng {
  /** Returns the next float in [0, 1). */
  next(): number;
  /** Returns the next integer in [0, max). */
  nextInt(max: number): number;
  /** Fisher-Yates shuffle, in place; returns the same array. */
  shuffle<T>(arr: T[]): T[];
  /** Returns the current 32-bit state, useful for snapshotting. */
  state(): number;
}

/**
 * Mulberry32 — small, fast, deterministic PRNG. Good enough for game RNG.
 * Public-domain reference implementation.
 */
export function createRng(seed: number): Rng {
  let s = seed | 0 || 1; // avoid zero state

  const next = (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (max: number): number => Math.floor(next() * max);

  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = nextInt(i + 1);
      const tmp = arr[i] as T;
      arr[i] = arr[j] as T;
      arr[j] = tmp;
    }
    return arr;
  };

  return { next, nextInt, shuffle, state: () => s };
}
