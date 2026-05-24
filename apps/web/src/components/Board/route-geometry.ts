import type { Route, Station } from '@ttr/engine';

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const PARALLEL_OFFSET = 9;

export const WAGON_LENGTH = 22;
export const WAGON_GAP = 5;

/**
 * Lay out a route as N fixed-width wagon slots centered between the two stations.
 * Slot width is constant across the entire board so the player can count slots = cost.
 */
export function segmentsFor(
  route: Route,
  a: Station,
  b: Station,
  options: { parallelSide?: -1 | 0 | 1 } = {},
): Segment[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return [];

  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;

  const offset = (options.parallelSide ?? 0) * PARALLEL_OFFSET;
  const midX = (a.x + b.x) / 2 + px * offset;
  const midY = (a.y + b.y) / 2 + py * offset;

  const totalLen = route.length * WAGON_LENGTH + (route.length - 1) * WAGON_GAP;
  const startT = -totalLen / 2;
  const stride = WAGON_LENGTH + WAGON_GAP;

  const segs: Segment[] = [];
  for (let i = 0; i < route.length; i++) {
    const t1 = startT + i * stride;
    const t2 = t1 + WAGON_LENGTH;
    segs.push({
      x1: midX + ux * t1,
      y1: midY + uy * t1,
      x2: midX + ux * t2,
      y2: midY + uy * t2,
    });
  }
  return segs;
}

/**
 * Assign a stable side to each route in a parallel pair so they render on opposite
 * sides of the connecting line. Returns a map from routeId → -1 | 0 | 1.
 */
export function parallelSides(routes: Route[]): Map<string, -1 | 0 | 1> {
  const sides = new Map<string, -1 | 0 | 1>();
  for (const r of routes) {
    if (!r.parallel) {
      sides.set(r.id, 0);
      continue;
    }
    // Deterministic: lex-smaller id gets +1, the other -1.
    sides.set(r.id, r.id < r.parallel ? 1 : -1);
  }
  return sides;
}
