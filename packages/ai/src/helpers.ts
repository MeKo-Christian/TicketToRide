import type {
  GameState,
  PlayerState,
  Route,
  RouteId,
  SolidColor,
  StationId,
  Ticket,
  TrainCardColor,
} from '@ttr/engine';
import { SOLID_COLORS } from '@ttr/engine';

export interface ClaimableRoute {
  route: Route;
  spend: TrainCardColor[];
}

/** Routes the player could legally claim this turn, paired with the cheapest spend. */
export function claimableRoutes(state: GameState, playerId: string): ClaimableRoute[] {
  if (state.turn !== playerId) return [];
  if (state.pendingSecondCard || state.pendingTicketDraw) return [];
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  const claimedByOther = new Set<RouteId>();
  for (const p of state.players) {
    for (const id of p.claimedRoutes) {
      if (p.id !== playerId) claimedByOther.add(id);
    }
  }

  const result: ClaimableRoute[] = [];
  for (const r of state.map.routes) {
    if (claimedByOther.has(r.id)) continue;
    if (player.claimedRoutes.includes(r.id)) continue;
    if (player.trainCars < r.length) continue;
    if (r.parallel) {
      const otherTaken = state.players.find((p) => p.claimedRoutes.includes(r.parallel ?? ''));
      if (otherTaken) {
        if (state.players.length < 4) continue;
        if (otherTaken.id === playerId) continue;
      }
    }
    const spend = cheapestSpend(player, r);
    if (spend) result.push({ route: r, spend });
  }
  return result;
}

/** Cheapest legal spend for `route`, preferring solid over rainbow. */
function cheapestSpend(player: PlayerState, route: Route): TrainCardColor[] | null {
  const rainbows = player.hand.rainbow;
  if (route.color !== 'gray') {
    const solid = player.hand[route.color];
    for (let r = 0; r <= Math.min(rainbows, route.length); r++) {
      const need = route.length - r;
      if (solid >= need) {
        return [
          ...Array(need).fill(route.color as TrainCardColor),
          ...Array(r).fill('rainbow' as TrainCardColor),
        ];
      }
    }
    return null;
  }
  // Gray: prefer a solid colour with the highest count.
  let best: { color: SolidColor; r: number } | null = null;
  for (const c of SOLID_COLORS) {
    const solid = player.hand[c];
    for (let r = 0; r <= Math.min(rainbows, route.length); r++) {
      if (solid >= route.length - r) {
        if (!best || r < best.r) best = { color: c, r };
        break;
      }
    }
  }
  if (best) {
    return [
      ...Array(route.length - best.r).fill(best.color as TrainCardColor),
      ...Array(best.r).fill('rainbow' as TrainCardColor),
    ];
  }
  if (rainbows >= route.length) {
    return Array(route.length).fill('rainbow' as TrainCardColor);
  }
  return null;
}

/**
 * Shortest path (by total length) between two stations using only routes that are
 * unclaimed-by-others OR already owned by the player. Returns Infinity if
 * unreachable. Also returns the list of route ids on the shortest path.
 */
export function shortestUsableRoute(
  state: GameState,
  playerId: string,
  from: StationId,
  to: StationId,
): { cost: number; routes: RouteId[] } {
  if (from === to) return { cost: 0, routes: [] };
  const blocked = new Set<RouteId>();
  for (const p of state.players) {
    if (p.id === playerId) continue;
    for (const id of p.claimedRoutes) blocked.add(id);
  }

  // Adjacency: station → array of (neighbour, length, routeId)
  const adj = new Map<StationId, { other: StationId; cost: number; routeId: RouteId }[]>();
  for (const r of state.map.routes) {
    if (blocked.has(r.id)) continue;
    adj.set(r.a, [...(adj.get(r.a) ?? []), { other: r.b, cost: r.length, routeId: r.id }]);
    adj.set(r.b, [...(adj.get(r.b) ?? []), { other: r.a, cost: r.length, routeId: r.id }]);
  }

  // Dijkstra.
  const dist = new Map<StationId, number>();
  const prev = new Map<StationId, { from: StationId; routeId: RouteId }>();
  dist.set(from, 0);
  const queue: StationId[] = [from];
  while (queue.length > 0) {
    queue.sort(
      (a, b) =>
        (dist.get(a) ?? Number.POSITIVE_INFINITY) - (dist.get(b) ?? Number.POSITIVE_INFINITY),
    );
    const node = queue.shift() as StationId;
    if (node === to) break;
    const here = dist.get(node) ?? Number.POSITIVE_INFINITY;
    for (const edge of adj.get(node) ?? []) {
      const alt = here + edge.cost;
      if (alt < (dist.get(edge.other) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.other, alt);
        prev.set(edge.other, { from: node, routeId: edge.routeId });
        if (!queue.includes(edge.other)) queue.push(edge.other);
      }
    }
  }

  const cost = dist.get(to) ?? Number.POSITIVE_INFINITY;
  if (cost === Number.POSITIVE_INFINITY) return { cost, routes: [] };

  const routes: RouteId[] = [];
  let cur: StationId | undefined = to;
  while (cur && cur !== from) {
    const step = prev.get(cur);
    if (!step) break;
    routes.push(step.routeId);
    cur = step.from;
  }
  return { cost, routes: routes.reverse() };
}

/**
 * Set of route ids on the shortest usable path of each *unsatisfied* ticket.
 * Returns routes the player still needs to claim to complete those tickets
 * (i.e. excludes routes they already own and any route on a satisfied ticket).
 */
export function routesOnTicketPaths(state: GameState, playerId: string): Set<RouteId> {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return new Set();
  const ownedSet = new Set(player.claimedRoutes);
  const satisfied = new Set(satisfiedTickets(state, playerId).map((t) => t.id));
  const targets = new Set<RouteId>();
  for (const t of player.tickets) {
    if (satisfied.has(t.id)) continue;
    const { routes } = shortestUsableRoute(state, playerId, t.from, t.to);
    for (const id of routes) {
      if (!ownedSet.has(id)) targets.add(id);
    }
  }
  return targets;
}

/** Tickets the player has already satisfied with their currently owned routes. */
export function satisfiedTickets(state: GameState, playerId: string): Ticket[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];
  const owned = state.map.routes.filter((r) => player.claimedRoutes.includes(r.id));
  const adj = new Map<StationId, StationId[]>();
  for (const r of owned) {
    adj.set(r.a, [...(adj.get(r.a) ?? []), r.b]);
    adj.set(r.b, [...(adj.get(r.b) ?? []), r.a]);
  }
  const connected = (from: StationId, to: StationId): boolean => {
    if (from === to) return true;
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
  return player.tickets.filter((t) => connected(t.from, t.to));
}

/**
 * For each solid colour, how many additional cards of that colour the player would need
 * to claim every route on their current ticket paths (rainbows already in hand count
 * toward any colour). Sorted descending by need.
 */
export function neededColors(state: GameState, playerId: string): Record<SolidColor, number> {
  const player = state.players.find((p) => p.id === playerId);
  const result: Record<SolidColor, number> = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    pink: 0,
    white: 0,
    black: 0,
  };
  if (!player) return result;
  const wanted = routesOnTicketPaths(state, playerId);
  const routesById = new Map(state.map.routes.map((r) => [r.id, r]));
  // Tally raw need by colour from wanted routes, ignoring gray (which can be paid with anything).
  for (const id of wanted) {
    const route = routesById.get(id);
    if (!route) continue;
    if (route.color === 'gray') {
      // attribute to player's strongest colour.
      let strongest: SolidColor = 'red';
      for (const c of SOLID_COLORS) {
        if (player.hand[c] > player.hand[strongest]) strongest = c;
      }
      result[strongest] += route.length;
    } else {
      result[route.color] += route.length;
    }
  }
  // Subtract what's already in hand (rainbows still flexible).
  for (const c of SOLID_COLORS) {
    result[c] = Math.max(0, result[c] - player.hand[c]);
  }
  return result;
}
