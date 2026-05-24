import { SOLID_COLORS, type StationId } from '@ttr/engine';
import { describe, expect, it } from 'vitest';
import { MAPS } from './index.js';

for (const { id, name, map } of MAPS) {
  describe(`${name} (${id}) stations`, () => {
    it('has at least 30 hand-curated stations', () => {
      expect(map.stations.length).toBeGreaterThanOrEqual(30);
    });

    it('every station has a unique id', () => {
      const ids = map.stations.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every station has a non-empty name and finite coords', () => {
      for (const s of map.stations) {
        expect(s.name.length).toBeGreaterThan(0);
        expect(Number.isFinite(s.x)).toBe(true);
        expect(Number.isFinite(s.y)).toBe(true);
      }
    });
  });

  describe(`${name} (${id}) routes`, () => {
    it('has at least one route per station on average (a connected playable network)', () => {
      expect(map.routes.length).toBeGreaterThanOrEqual(map.stations.length);
    });

    it('every route id is unique', () => {
      const ids = map.routes.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every route endpoint refers to a real station', () => {
      const stations = new Set(map.stations.map((s) => s.id));
      for (const r of map.routes) {
        expect(stations.has(r.a)).toBe(true);
        expect(stations.has(r.b)).toBe(true);
        expect(r.a).not.toBe(r.b);
      }
    });

    it('every route has length in [1, 6]', () => {
      for (const r of map.routes) {
        expect(r.length).toBeGreaterThanOrEqual(1);
        expect(r.length).toBeLessThanOrEqual(6);
        expect(Number.isInteger(r.length)).toBe(true);
      }
    });

    it('every route color is gray or a solid color (never rainbow)', () => {
      const allowed = new Set<string>([...SOLID_COLORS, 'gray']);
      for (const r of map.routes) {
        expect(allowed.has(r.color)).toBe(true);
      }
    });

    it('every line number is a real Hannover Stadtbahn line (1-18)', () => {
      for (const r of map.routes) {
        expect(r.line).toBeGreaterThanOrEqual(1);
        expect(r.line).toBeLessThanOrEqual(18);
      }
    });

    it('the route graph is connected', () => {
      const adj = new Map<StationId, StationId[]>();
      for (const r of map.routes) {
        adj.set(r.a, [...(adj.get(r.a) ?? []), r.b]);
        adj.set(r.b, [...(adj.get(r.b) ?? []), r.a]);
      }
      const start = map.stations[0]!.id;
      const visited = new Set<StationId>([start]);
      const queue: StationId[] = [start];
      while (queue.length > 0) {
        const n = queue.shift() as StationId;
        for (const next of adj.get(n) ?? []) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
      expect(visited.size).toBe(map.stations.length);
    });
  });

  describe(`${name} (${id}) parallel (double) routes`, () => {
    it('every parallel reference is symmetric and points to a real route', () => {
      const byId = new Map(map.routes.map((r) => [r.id, r]));
      for (const r of map.routes) {
        if (!r.parallel) continue;
        const other = byId.get(r.parallel);
        expect(other).toBeDefined();
        expect(other?.parallel).toBe(r.id);
      }
    });

    it('parallel pairs connect the same two stations', () => {
      const byId = new Map(map.routes.map((r) => [r.id, r]));
      for (const r of map.routes) {
        if (!r.parallel) continue;
        const other = byId.get(r.parallel)!;
        const samePair =
          (r.a === other.a && r.b === other.b) || (r.a === other.b && r.b === other.a);
        expect(samePair).toBe(true);
      }
    });

    it('parallel pairs have different gameplay colors (so claiming is meaningful)', () => {
      const byId = new Map(map.routes.map((r) => [r.id, r]));
      const seen = new Set<string>();
      for (const r of map.routes) {
        if (!r.parallel || seen.has(r.id)) continue;
        const other = byId.get(r.parallel)!;
        seen.add(other.id);
        expect(r.color).not.toBe(other.color);
      }
    });

    it('has at least one parallel pair for 4-5 player double-route play', () => {
      expect(map.routes.some((r) => r.parallel)).toBe(true);
    });
  });

  describe(`${name} (${id}) tickets`, () => {
    it('has 30-40 tickets', () => {
      expect(map.tickets.length).toBeGreaterThanOrEqual(30);
      expect(map.tickets.length).toBeLessThanOrEqual(40);
    });

    it('every ticket id is unique', () => {
      const ids = map.tickets.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every ticket has from != to and points 1-22', () => {
      for (const t of map.tickets) {
        expect(t.from).not.toBe(t.to);
        expect(t.points).toBeGreaterThanOrEqual(1);
        expect(t.points).toBeLessThanOrEqual(22);
      }
    });

    it('every ticket endpoint exists and is reachable on the graph', () => {
      const stations = new Set(map.stations.map((s) => s.id));
      const adj = new Map<StationId, StationId[]>();
      for (const r of map.routes) {
        adj.set(r.a, [...(adj.get(r.a) ?? []), r.b]);
        adj.set(r.b, [...(adj.get(r.b) ?? []), r.a]);
      }
      const reachable = (from: StationId, to: StationId): boolean => {
        const visited = new Set<StationId>([from]);
        const queue: StationId[] = [from];
        while (queue.length > 0) {
          const n = queue.shift() as StationId;
          if (n === to) return true;
          for (const next of adj.get(n) ?? []) {
            if (!visited.has(next)) {
              visited.add(next);
              queue.push(next);
            }
          }
        }
        return false;
      };
      for (const t of map.tickets) {
        expect(stations.has(t.from)).toBe(true);
        expect(stations.has(t.to)).toBe(true);
        expect(reachable(t.from, t.to)).toBe(true);
      }
    });

    it('mixes short and long tickets (at least one ≤6 pts and one ≥15 pts)', () => {
      expect(map.tickets.some((t) => t.points <= 6)).toBe(true);
      expect(map.tickets.some((t) => t.points >= 15)).toBe(true);
    });
  });

  describe(`${name} (${id}) balance`, () => {
    it('total train-car cost (sum of route lengths) is in a reasonable band', () => {
      const sum = map.routes.reduce((acc, r) => acc + r.length, 0);
      expect(sum).toBeGreaterThanOrEqual(80);
      expect(sum).toBeLessThanOrEqual(260);
    });

    it('no single color of route dominates (each color ≤ 35% of solid-colored routes)', () => {
      const counts = new Map<string, number>();
      let totalSolid = 0;
      for (const r of map.routes) {
        if (r.color === 'gray') continue;
        totalSolid++;
        counts.set(r.color, (counts.get(r.color) ?? 0) + 1);
      }
      for (const [, n] of counts) {
        expect(n / totalSolid).toBeLessThanOrEqual(0.35);
      }
    });
  });

  describe(`${name} (${id}) layout`, () => {
    // A station must not sit on top of an unrelated route's wagon strip. We flag a
    // station that projects onto the *middle* of a segment it isn't an endpoint of
    // and lies closer than this clearance to the segment centreline.
    const MIN_CLEARANCE = 16;

    it('no station overlaps a track it is not an endpoint of', () => {
      const offenders: string[] = [];
      for (const r of map.routes) {
        const a = map.stations.find((s) => s.id === r.a)!;
        const b = map.stations.find((s) => s.id === r.b)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) continue;
        for (const c of map.stations) {
          if (c.id === r.a || c.id === r.b) continue;
          const t = ((c.x - a.x) * dx + (c.y - a.y) * dy) / len2;
          // Only the middle portion of the segment carries wagons near this station.
          if (t <= 0.08 || t >= 0.92) continue;
          const px = a.x + t * dx;
          const py = a.y + t * dy;
          const dist = Math.hypot(c.x - px, c.y - py);
          if (dist < MIN_CLEARANCE) {
            offenders.push(`${c.id} is ${dist.toFixed(1)}u from route ${r.id}`);
          }
        }
      }
      expect(offenders, offenders.join('\n')).toHaveLength(0);
    });
  });
}
