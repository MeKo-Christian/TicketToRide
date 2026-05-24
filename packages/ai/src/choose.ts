import type { Action, GameState, RouteId, SolidColor, TrainCardColor } from '@ttr/engine';
import { SOLID_COLORS } from '@ttr/engine';
import {
  type ClaimableRoute,
  claimableRoutes,
  neededColors,
  routesOnTicketPaths,
  satisfiedTickets,
  shortestUsableRoute,
} from './helpers.js';
import type { Difficulty } from './index.js';

/**
 * Pick the best legal action for `playerId` under the requested difficulty.
 * Pure: same input → same output.
 *
 * Priority of action types (all difficulties):
 *  1. Resolve any pending ticket draw — keep tickets that look feasible.
 *  2. If we're in the middle of a draw (pendingSecondCard), grab another card.
 *  3. Difficulty-specific strategy choosing between claim / draw cards / draw tickets.
 *  4. Fallback: blind draw if anything goes wrong.
 */
export function chooseAction(state: GameState, playerId: string, difficulty: Difficulty): Action {
  // 1. Pending ticket draw (setup or mid-game).
  if (state.pendingTicketDraw && state.pendingTicketDraw.playerId === playerId) {
    return chooseKeepTickets(state, playerId, difficulty);
  }
  // 2. Second card of a two-card draw turn.
  if (state.pendingSecondCard && state.turn === playerId) {
    return chooseSecondCardDraw(state, playerId);
  }
  if (state.turn !== playerId) {
    // Should not happen — defensive: blind draw is always legal during own turn,
    // but we're not in our turn so just return a no-op-ish action and let the
    // engine emit "invalid". Caller should never invoke us out of turn.
    return { type: 'DrawBlind', playerId };
  }

  const claims = claimableRoutes(state, playerId);
  const wanted = routesOnTicketPaths(state, playerId);

  // Tickets we currently can't reach (other players blocked us) — mid-game
  // ticket draw is a normal/aggressive escape valve.
  const unreachable = countUnreachableTickets(state, playerId);

  switch (difficulty) {
    case 'passive':
      return passiveAction(state, playerId, claims, wanted);
    case 'normal':
      return normalAction(state, playerId, claims, wanted, unreachable);
    case 'aggressive':
      return aggressiveAction(state, playerId, claims, wanted, unreachable);
  }
}

function chooseKeepTickets(state: GameState, playerId: string, difficulty: Difficulty): Action {
  const pending = state.pendingTicketDraw!;
  // Score each offered ticket by reachability + value-per-length.
  const scored = pending.offered.map((t) => {
    const { cost } = shortestUsableRoute(state, playerId, t.from, t.to);
    if (cost === Number.POSITIVE_INFINITY) return { id: t.id, score: -1 };
    return { id: t.id, score: t.points / Math.max(1, cost) };
  });

  // Passive: keep the two best; aggressive: keep all three if any look good.
  const sorted = scored.sort((a, b) => b.score - a.score);
  const minKeep = pending.minKeep;

  let keepCount: number;
  if (difficulty === 'passive') {
    keepCount = minKeep;
  } else if (difficulty === 'normal') {
    // Keep all whose score >= median + minKeep at least.
    const positives = sorted.filter((s) => s.score > 0.5);
    keepCount = Math.max(minKeep, Math.min(positives.length, sorted.length));
  } else {
    // Aggressive: greedy, keep every positive.
    const positives = sorted.filter((s) => s.score > 0);
    keepCount = Math.max(minKeep, positives.length);
  }

  return {
    type: 'KeepTickets',
    playerId,
    keep: sorted.slice(0, keepCount).map((s) => s.id),
  };
}

function chooseSecondCardDraw(state: GameState, playerId: string): Action {
  // Prefer a face-up non-rainbow that we need.
  const need = neededColors(state, playerId);
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  state.faceUp.forEach((card, i) => {
    if (card === 'rainbow') return; // rule: rainbow face-up disallowed as 2nd card
    const score = need[card as SolidColor] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  if (bestIndex >= 0 && bestScore > 0) {
    return { type: 'DrawFaceUp', playerId, index: bestIndex };
  }
  return { type: 'DrawBlind', playerId };
}

// === Passive ===

function passiveAction(
  state: GameState,
  playerId: string,
  claims: ClaimableRoute[],
  wanted: Set<RouteId>,
): Action {
  // 1. Claim a route on a ticket path, longest first.
  const onPath = claims.filter((c) => wanted.has(c.route.id));
  if (onPath.length > 0) {
    onPath.sort((a, b) => b.route.length - a.route.length);
    return claimAction(playerId, onPath[0]!);
  }

  // 2. Hand bloated or many cards going to waste? Spend on the longest available route.
  const me = state.players.find((p) => p.id === playerId)!;
  const handSize = handTotal(me);
  if (handSize >= 8 && claims.length > 0) {
    const best = [...claims].sort((a, b) => b.route.length - a.route.length)[0]!;
    return claimAction(playerId, best);
  }

  // 3. Draw the most useful card.
  return drawBestCard(state, playerId);
}

// === Normal ===

function normalAction(
  state: GameState,
  playerId: string,
  claims: ClaimableRoute[],
  wanted: Set<RouteId>,
  unreachableTickets: number,
): Action {
  // Same as passive but also considers connector routes and ticket-swap escape.

  // If 2+ of our tickets are unreachable and ticket deck still has cards, swap.
  if (unreachableTickets >= 2 && state.ticketDeck.length >= 3 && !state.pendingSecondCard) {
    return { type: 'DrawTickets', playerId };
  }

  // Claim on-path routes first, longest preferred.
  const onPath = claims.filter((c) => wanted.has(c.route.id));
  if (onPath.length > 0) {
    onPath.sort((a, b) => b.route.length - a.route.length);
    return claimAction(playerId, onPath[0]!);
  }

  // Otherwise, claim a longer-than-3 route if it shrinks our deficit.
  const me = state.players.find((p) => p.id === playerId)!;
  const opportunistic = claims
    .filter((c) => c.route.length >= 3)
    .sort((a, b) => b.route.length - a.route.length);
  if (opportunistic.length > 0 && me.trainCars > 12) {
    return claimAction(playerId, opportunistic[0]!);
  }

  // Bloated hand fallback — same as passive.
  if (handTotal(me) >= 8 && claims.length > 0) {
    const best = [...claims].sort((a, b) => b.route.length - a.route.length)[0]!;
    return claimAction(playerId, best);
  }

  return drawBestCard(state, playerId);
}

// === Aggressive ===

function aggressiveAction(
  state: GameState,
  playerId: string,
  claims: ClaimableRoute[],
  wanted: Set<RouteId>,
  unreachableTickets: number,
): Action {
  // If a ticket is unreachable and deck has space, swap.
  if (
    unreachableTickets >= 1 &&
    state.ticketDeck.length >= 3 &&
    state.players.find((p) => p.id === playerId)!.tickets.length < 6 &&
    !state.pendingSecondCard
  ) {
    // Only swap once every few turns to avoid loops — simple heuristic:
    // when at least half our tickets are unreachable.
    const me = state.players.find((p) => p.id === playerId)!;
    if (unreachableTickets / Math.max(1, me.tickets.length) >= 0.5) {
      return { type: 'DrawTickets', playerId };
    }
  }

  const onPath = claims.filter((c) => wanted.has(c.route.id));
  if (onPath.length > 0) {
    onPath.sort((a, b) => b.route.length - a.route.length);
    return claimAction(playerId, onPath[0]!);
  }

  // Compete for longest-path: prioritise long routes (length 4+).
  const me = state.players.find((p) => p.id === playerId)!;
  const longShots = claims
    .filter((c) => c.route.length >= 4)
    .sort((a, b) => b.route.length - a.route.length);
  if (longShots.length > 0 && me.trainCars >= 15) {
    return claimAction(playerId, longShots[0]!);
  }

  // Spend something if we've got a fat hand and somewhere to put it.
  if (handTotal(me) >= 7 && claims.length > 0) {
    const best = [...claims].sort((a, b) => b.route.length - a.route.length)[0]!;
    return claimAction(playerId, best);
  }

  return drawBestCard(state, playerId);
}

function handTotal(p: { hand: Record<string, number> }): number {
  return Object.values(p.hand).reduce((a, b) => a + b, 0);
}

// === Common drawing logic ===

function drawBestCard(state: GameState, playerId: string): Action {
  const need = neededColors(state, playerId);

  // 1. Face-up rainbow is always great (one of our two draws, ends turn).
  const rainbowIdx = state.faceUp.findIndex((c) => c === 'rainbow');
  if (rainbowIdx >= 0 && !state.pendingSecondCard) {
    return { type: 'DrawFaceUp', playerId, index: rainbowIdx };
  }

  // 2. Face-up matching a colour we need most.
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  state.faceUp.forEach((card, i) => {
    if (card === 'rainbow' && state.pendingSecondCard) return;
    if (card === 'rainbow') return; // handled above
    const score = need[card as SolidColor] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  if (bestIndex >= 0 && bestScore > 0) {
    return { type: 'DrawFaceUp', playerId, index: bestIndex };
  }

  // 3. Blind draw.
  return { type: 'DrawBlind', playerId };
}

function claimAction(playerId: string, c: ClaimableRoute): Action {
  return {
    type: 'ClaimRoute',
    playerId,
    routeId: c.route.id,
    spent: c.spend,
  };
}

function countUnreachableTickets(state: GameState, playerId: string): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;
  const satisfied = new Set(satisfiedTickets(state, playerId).map((t) => t.id));
  let count = 0;
  for (const t of player.tickets) {
    if (satisfied.has(t.id)) continue;
    const { cost } = shortestUsableRoute(state, playerId, t.from, t.to);
    if (cost === Number.POSITIVE_INFINITY) count++;
  }
  return count;
}

// Silence unused-import noise for downstream tree-shaking; these are intentionally
// re-exported types from the engine that we may want to surface from the AI package.
export type { Action, RouteId, SolidColor, TrainCardColor };
