import type { GameState, PlayerState, Route, StationId } from './types.js';

export interface PlayerScore {
  playerId: string;
  routePoints: number;
  ticketPoints: number;
  longestPath: number;
  longestPathBonus: number;
  total: number;
}

export const LONGEST_PATH_BONUS = 10;

export function finalScores(state: GameState): PlayerScore[] {
  const longestPerPlayer = new Map<string, number>();
  for (const p of state.players) {
    longestPerPlayer.set(p.id, longestPathFor(p, state.map.routes));
  }
  const maxLongest = Math.max(...longestPerPlayer.values(), 0);

  return state.players.map((p) => {
    const routePoints = p.score; // accumulated during play
    const ticketPoints = ticketScoreFor(p, state.map.routes);
    const longestPath = longestPerPlayer.get(p.id) ?? 0;
    const longestPathBonus = maxLongest > 0 && longestPath === maxLongest ? LONGEST_PATH_BONUS : 0;
    return {
      playerId: p.id,
      routePoints,
      ticketPoints,
      longestPath,
      longestPathBonus,
      total: routePoints + ticketPoints + longestPathBonus,
    };
  });
}

function ticketScoreFor(player: PlayerState, routes: Route[]): number {
  const owned = routes.filter((r) => player.claimedRoutes.includes(r.id));
  let total = 0;
  for (const t of player.tickets) {
    total += stationsConnected(t.from, t.to, owned) ? t.points : -t.points;
  }
  return total;
}

function stationsConnected(from: StationId, to: StationId, routes: Route[]): boolean {
  if (from === to) return true;
  const adj = new Map<StationId, StationId[]>();
  for (const r of routes) {
    adj.set(r.a, [...(adj.get(r.a) ?? []), r.b]);
    adj.set(r.b, [...(adj.get(r.b) ?? []), r.a]);
  }
  const visited = new Set<StationId>([from]);
  const queue: StationId[] = [from];
  while (queue.length > 0) {
    const node = queue.shift() as StationId;
    if (node === to) return true;
    for (const next of adj.get(node) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

function longestPathFor(player: PlayerState, routes: Route[]): number {
  const owned = routes.filter((r) => player.claimedRoutes.includes(r.id));
  if (owned.length === 0) return 0;

  type Edge = { other: StationId; length: number; id: string };
  const adj = new Map<StationId, Edge[]>();
  for (const r of owned) {
    adj.set(r.a, [...(adj.get(r.a) ?? []), { other: r.b, length: r.length, id: r.id }]);
    adj.set(r.b, [...(adj.get(r.b) ?? []), { other: r.a, length: r.length, id: r.id }]);
  }

  // DFS from each station, never reusing edges. Return longest length sum found.
  let best = 0;
  const stations = Array.from(adj.keys());

  const used = new Set<string>();
  const dfs = (node: StationId, lenSoFar: number): void => {
    if (lenSoFar > best) best = lenSoFar;
    for (const edge of adj.get(node) ?? []) {
      if (used.has(edge.id)) continue;
      used.add(edge.id);
      dfs(edge.other, lenSoFar + edge.length);
      used.delete(edge.id);
    }
  };

  for (const start of stations) dfs(start, 0);
  return best;
}
