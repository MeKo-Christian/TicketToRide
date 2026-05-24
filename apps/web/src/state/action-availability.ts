import type { GameState, Route, RouteId, SolidColor, TrainCardColor } from '@ttr/engine';
import { SOLID_COLORS } from '@ttr/engine';

export interface Allow {
  allowed: boolean;
  reason?: string;
}

const ALLOWED: Allow = { allowed: true };
const deny = (reason: string): Allow => ({ allowed: false, reason });

/** Is it this player's turn and are they free of pending modal interactions? */
function activeTurnCheck(state: GameState, playerId: string): Allow {
  if (state.phase === 'finished') return deny('Game is over');
  if (state.phase === 'setup') return deny('Waiting for setup to complete');
  if (state.turn !== playerId) return deny('Not your turn');
  if (state.pendingTicketDraw) return deny('Resolve ticket draw first');
  return ALLOWED;
}

export function canDrawBlind(state: GameState, playerId: string): Allow {
  const a = activeTurnCheck(state, playerId);
  if (!a.allowed) return a;
  if (state.trainDeck.length + state.discardPile.length === 0) {
    return deny('Draw deck is empty');
  }
  return ALLOWED;
}

export function canDrawFaceUp(state: GameState, playerId: string, index: number): Allow {
  const a = activeTurnCheck(state, playerId);
  if (!a.allowed) return a;
  const card = state.faceUp[index];
  if (!card) return deny('No card in that slot');
  if (state.pendingSecondCard && card === 'rainbow') {
    return deny('Cannot take a face-up rainbow as your second card');
  }
  return ALLOWED;
}

export function canDrawTickets(state: GameState, playerId: string): Allow {
  const a = activeTurnCheck(state, playerId);
  if (!a.allowed) return a;
  if (state.pendingSecondCard) return deny('Finish drawing cards first');
  if (state.ticketDeck.length === 0) return deny('No tickets remaining');
  return ALLOWED;
}

/** Whether the player could conceivably claim this route — ignores card-spend specifics. */
export function canClaimRoute(state: GameState, playerId: string, routeId: RouteId): Allow {
  const a = activeTurnCheck(state, playerId);
  if (!a.allowed) return a;
  if (state.pendingSecondCard) return deny('Finish drawing cards first');

  const route = state.map.routes.find((r) => r.id === routeId);
  if (!route) return deny('Unknown route');

  if (state.players.some((p) => p.claimedRoutes.includes(routeId))) {
    return deny('Already claimed');
  }
  if (route.parallel) {
    const parallelClaim = state.players.find((p) => p.claimedRoutes.includes(route.parallel!));
    if (parallelClaim && parallelClaim.id === playerId) {
      return deny('Cannot claim both parallels');
    }
  }
  const player = state.players.find((p) => p.id === playerId)!;
  if (player.trainCars < route.length) return deny('Not enough train cars');
  if (validSpendOptions(state, playerId, routeId).length === 0) {
    return deny('Not enough matching cards');
  }
  return ALLOWED;
}

/**
 * Enumerate every legal way the player could pay for `route` with cards they hold.
 * Each option is a multiset of cards summing to `route.length`. Sorted by rainbow usage
 * ascending (cheapest first), then by primary color name.
 */
export function validSpendOptions(
  state: GameState,
  playerId: string,
  routeId: RouteId,
): TrainCardColor[][] {
  const route = state.map.routes.find((r) => r.id === routeId);
  if (!route) return [];
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  const need = route.length;
  const rainbowCount = player.hand.rainbow ?? 0;

  const options: TrainCardColor[][] = [];
  const colorsToTry: SolidColor[] =
    route.color === 'gray' ? [...SOLID_COLORS] : ([route.color] as SolidColor[]);

  // For each candidate solid color, try k = 0..min(rainbowCount, need) rainbows.
  for (const color of colorsToTry) {
    const solidHeld = player.hand[color] ?? 0;
    for (let k = 0; k <= Math.min(rainbowCount, need); k++) {
      const solidNeeded = need - k;
      if (solidNeeded < 0) continue;
      if (solidHeld >= solidNeeded) {
        options.push([...Array(solidNeeded).fill(color), ...Array(k).fill('rainbow')]);
      }
    }
  }
  // All-rainbow option (only meaningful for gray; for solid routes it's already covered above when k=need).
  if (route.color === 'gray' && rainbowCount >= need) {
    options.push(Array(need).fill('rainbow'));
  }

  // De-dup (an all-rainbow spend might appear once per candidate solid color).
  const seen = new Set<string>();
  const unique = options.filter((o) => {
    const key = [...o].sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => {
    const ra = a.filter((c) => c === 'rainbow').length;
    const rb = b.filter((c) => c === 'rainbow').length;
    if (ra !== rb) return ra - rb;
    return (a[0] ?? '').localeCompare(b[0] ?? '');
  });
  return unique;
}

export interface RouteOwnership {
  routeId: RouteId;
  owner: string | null;
}

export function ownershipFor(state: GameState): Map<RouteId, string | null> {
  const m = new Map<RouteId, string | null>();
  for (const r of state.map.routes) m.set(r.id, null);
  for (const p of state.players) {
    for (const id of p.claimedRoutes) m.set(id, p.id);
  }
  return m;
}

export function routeById(state: GameState, id: RouteId): Route | undefined {
  return state.map.routes.find((r) => r.id === id);
}
