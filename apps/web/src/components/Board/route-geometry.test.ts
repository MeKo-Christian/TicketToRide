import type { Route, Station } from '@ttr/engine';
import { describe, expect, it } from 'vitest';
import { parallelSides, segmentsFor } from './route-geometry.js';

const a: Station = { id: 'a', name: 'A', x: 0, y: 0 };
const b: Station = { id: 'b', name: 'B', x: 500, y: 0 };

function route(length: number, opts: Partial<Route> = {}): Route {
  return {
    id: 'r',
    a: 'a',
    b: 'b',
    length,
    color: 'red',
    line: 1,
    ...opts,
  };
}

describe('segmentsFor', () => {
  it('returns exactly `length` segments', () => {
    expect(segmentsFor(route(3), a, b)).toHaveLength(3);
    expect(segmentsFor(route(6), a, b)).toHaveLength(6);
  });

  it('all segments lie along the line between stations (zero degenerates handled)', () => {
    const segs = segmentsFor(route(4), a, b);
    // Horizontal line: every y should be ~0.
    for (const s of segs) {
      expect(Math.abs(s.y1)).toBeLessThan(0.001);
      expect(Math.abs(s.y2)).toBeLessThan(0.001);
    }
    // x ordering monotonically increases.
    for (let i = 1; i < segs.length; i++) {
      expect(segs[i]!.x1).toBeGreaterThan(segs[i - 1]!.x2);
    }
  });

  it('segments stop short of the station markers (gap left at each end)', () => {
    const segs = segmentsFor(route(2), a, b);
    expect(segs[0]!.x1).toBeGreaterThan(0);
    expect(segs[segs.length - 1]!.x2).toBeLessThan(500);
  });

  it('zero distance returns empty', () => {
    expect(segmentsFor(route(2), a, { ...a, id: 'b' })).toHaveLength(0);
  });

  it('parallelSide shifts the entire line perpendicularly', () => {
    const centre = segmentsFor(route(3), a, b);
    const above = segmentsFor(route(3), a, b, { parallelSide: 1 });
    const below = segmentsFor(route(3), a, b, { parallelSide: -1 });
    expect(above[0]!.y1).not.toBe(centre[0]!.y1);
    expect(below[0]!.y1).toBe(-above[0]!.y1);
  });
});

describe('parallelSides', () => {
  it('non-parallel routes get side 0', () => {
    const sides = parallelSides([route(2, { id: 'solo' })]);
    expect(sides.get('solo')).toBe(0);
  });

  it('parallel pair gets opposite sides', () => {
    const sides = parallelSides([
      route(1, { id: 'aaa', parallel: 'bbb' }),
      route(1, { id: 'bbb', parallel: 'aaa' }),
    ]);
    expect(sides.get('aaa')).toBe(1);
    expect(sides.get('bbb')).toBe(-1);
  });
});
