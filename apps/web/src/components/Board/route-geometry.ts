import type { Route, Station } from '@ttr/engine';

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const STATION_RADIUS = 18;
const SEGMENT_GAP = 4;
const PARALLEL_OFFSET = 9;

/**
 * Split a route into N carriage-shaped segments. Handles parallel-route offsetting
 * so double routes don't overlap.
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
  // Left-hand perpendicular.
  const px = -uy;
  const py = ux;

  const offset = (options.parallelSide ?? 0) * PARALLEL_OFFSET;
  const startX = a.x + ux * STATION_RADIUS + px * offset;
  const startY = a.y + uy * STATION_RADIUS + py * offset;
  const endX = b.x - ux * STATION_RADIUS + px * offset;
  const endY = b.y - uy * STATION_RADIUS + py * offset;

  const usable = Math.hypot(endX - startX, endY - startY);
  if (usable <= 0) return [];

  const segLen = usable / route.length;
  const segs: Segment[] = [];
  for (let i = 0; i < route.length; i++) {
    const t1 = i * segLen + SEGMENT_GAP / 2;
    const t2 = (i + 1) * segLen - SEGMENT_GAP / 2;
    segs.push({
      x1: startX + ux * t1,
      y1: startY + uy * t1,
      x2: startX + ux * t2,
      y2: startY + uy * t2,
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
