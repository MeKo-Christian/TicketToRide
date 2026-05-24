import { SOLID_COLORS, type StationId } from '@ttr/engine';
import { describe, expect, it } from 'vitest';
import { hannoverMap } from './hannover.js';

describe('hannoverMap stations', () => {
  it('has at least 30 hand-curated stations', () => {
    expect(hannoverMap.stations.length).toBeGreaterThanOrEqual(30);
  });

  it('every station has a unique id', () => {
    const ids = hannoverMap.stations.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every station has a non-empty name and finite coords', () => {
    for (const s of hannoverMap.stations) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(Number.isFinite(s.x)).toBe(true);
      expect(Number.isFinite(s.y)).toBe(true);
    }
  });
});

describe('hannoverMap routes', () => {
  it('has at least one route per station on average (a connected playable network)', () => {
    expect(hannoverMap.routes.length).toBeGreaterThanOrEqual(hannoverMap.stations.length);
  });

  it('every route id is unique', () => {
    const ids = hannoverMap.routes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every route endpoint refers to a real station', () => {
    const stations = new Set(hannoverMap.stations.map((s) => s.id));
    for (const r of hannoverMap.routes) {
      expect(stations.has(r.a)).toBe(true);
      expect(stations.has(r.b)).toBe(true);
      expect(r.a).not.toBe(r.b);
    }
  });

  it('every route has length in [1, 6]', () => {
    for (const r of hannoverMap.routes) {
      expect(r.length).toBeGreaterThanOrEqual(1);
      expect(r.length).toBeLessThanOrEqual(6);
      expect(Number.isInteger(r.length)).toBe(true);
    }
  });

  it('every route color is gray or a solid color (never rainbow)', () => {
    const allowed = new Set<string>([...SOLID_COLORS, 'gray']);
    for (const r of hannoverMap.routes) {
      expect(allowed.has(r.color)).toBe(true);
    }
  });

  it('every line number is a real Hannover Stadtbahn line (1-18)', () => {
    for (const r of hannoverMap.routes) {
      expect(r.line).toBeGreaterThanOrEqual(1);
      expect(r.line).toBeLessThanOrEqual(18);
    }
  });

  it('the route graph is connected', () => {
    const adj = new Map<StationId, StationId[]>();
    for (const r of hannoverMap.routes) {
      adj.set(r.a, [...(adj.get(r.a) ?? []), r.b]);
      adj.set(r.b, [...(adj.get(r.b) ?? []), r.a]);
    }
    const start = hannoverMap.stations[0]!.id;
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
    expect(visited.size).toBe(hannoverMap.stations.length);
  });
});

describe('hannoverMap parallel (double) routes', () => {
  it('every parallel reference is symmetric and points to a real route', () => {
    const byId = new Map(hannoverMap.routes.map((r) => [r.id, r]));
    for (const r of hannoverMap.routes) {
      if (!r.parallel) continue;
      const other = byId.get(r.parallel);
      expect(other).toBeDefined();
      expect(other?.parallel).toBe(r.id);
    }
  });

  it('parallel pairs connect the same two stations', () => {
    const byId = new Map(hannoverMap.routes.map((r) => [r.id, r]));
    for (const r of hannoverMap.routes) {
      if (!r.parallel) continue;
      const other = byId.get(r.parallel)!;
      const samePair = (r.a === other.a && r.b === other.b) || (r.a === other.b && r.b === other.a);
      expect(samePair).toBe(true);
    }
  });

  it('parallel pairs have different gameplay colors (so claiming is meaningful)', () => {
    const byId = new Map(hannoverMap.routes.map((r) => [r.id, r]));
    const seen = new Set<string>();
    for (const r of hannoverMap.routes) {
      if (!r.parallel || seen.has(r.id)) continue;
      const other = byId.get(r.parallel)!;
      seen.add(other.id);
      expect(r.color).not.toBe(other.color);
    }
  });

  it('has at least one parallel pair for 4-5 player double-route play', () => {
    expect(hannoverMap.routes.some((r) => r.parallel)).toBe(true);
  });
});

describe('hannoverMap tickets', () => {
  it('has 30-40 tickets', () => {
    expect(hannoverMap.tickets.length).toBeGreaterThanOrEqual(30);
    expect(hannoverMap.tickets.length).toBeLessThanOrEqual(40);
  });

  it('every ticket id is unique', () => {
    const ids = hannoverMap.tickets.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every ticket has from != to and points 1-22', () => {
    for (const t of hannoverMap.tickets) {
      expect(t.from).not.toBe(t.to);
      expect(t.points).toBeGreaterThanOrEqual(1);
      expect(t.points).toBeLessThanOrEqual(22);
    }
  });

  it('every ticket endpoint exists and is reachable on the graph', () => {
    const stations = new Set(hannoverMap.stations.map((s) => s.id));
    const adj = new Map<StationId, StationId[]>();
    for (const r of hannoverMap.routes) {
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
    for (const t of hannoverMap.tickets) {
      expect(stations.has(t.from)).toBe(true);
      expect(stations.has(t.to)).toBe(true);
      expect(reachable(t.from, t.to)).toBe(true);
    }
  });

  it('mixes short and long tickets (at least one ≤6 pts and one ≥15 pts)', () => {
    expect(hannoverMap.tickets.some((t) => t.points <= 6)).toBe(true);
    expect(hannoverMap.tickets.some((t) => t.points >= 15)).toBe(true);
  });
});

describe('hannoverMap balance', () => {
  it('total train-car cost (sum of route lengths) is in a reasonable band for 45 cars/player', () => {
    const sum = hannoverMap.routes.reduce((acc, r) => acc + r.length, 0);
    // Hannover map has ~31 stations and ~40 routes (smaller than TTR-USA's 36/79).
    // Allow 80-260 to accommodate the tighter, more realistic Stadtbahn network.
    expect(sum).toBeGreaterThanOrEqual(80);
    expect(sum).toBeLessThanOrEqual(260);
  });

  it('no single color of route dominates (each color ≤ 35% of solid-colored routes)', () => {
    const counts = new Map<string, number>();
    let totalSolid = 0;
    for (const r of hannoverMap.routes) {
      if (r.color === 'gray') continue;
      totalSolid++;
      counts.set(r.color, (counts.get(r.color) ?? 0) + 1);
    }
    for (const [, n] of counts) {
      expect(n / totalSolid).toBeLessThanOrEqual(0.35);
    }
  });
});
