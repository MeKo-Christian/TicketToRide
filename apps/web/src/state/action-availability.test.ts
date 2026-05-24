import type { GameConfig, GameState, Hand } from '@ttr/engine';
import { initialState, reduce } from '@ttr/engine';
import { hannoverMap } from '@ttr/map-data';
import { describe, expect, it } from 'vitest';
import {
  canClaimRoute,
  canDrawBlind,
  canDrawFaceUp,
  canDrawTickets,
  validSpendOptions,
} from './action-availability.js';

function emptyHand(): Hand {
  return {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    pink: 0,
    white: 0,
    black: 0,
    rainbow: 0,
  };
}

function gameInPlay(): GameState {
  const cfg: GameConfig = {
    seed: 7,
    map: hannoverMap,
    players: [
      { id: 'a', name: 'A', color: 'red', isAI: false },
      { id: 'b', name: 'B', color: 'blue', isAI: false },
    ],
  };
  let s = initialState(cfg);
  // Both players keep their first 2 offered tickets via the real reducer.
  while (s.phase === 'setup' && s.pendingTicketDraw) {
    const pending = s.pendingTicketDraw;
    s = reduce(s, {
      type: 'KeepTickets',
      playerId: pending.playerId,
      keep: pending.offered.slice(0, 2).map((t) => t.id),
    });
  }
  return s;
}

describe('action availability — turn ownership', () => {
  it('denies draws when it is not your turn', () => {
    const s = gameInPlay();
    const other = s.players.find((p) => p.id !== s.turn)!.id;
    expect(canDrawBlind(s, other).allowed).toBe(false);
    expect(canDrawTickets(s, other).allowed).toBe(false);
  });

  it('denies all actions while a ticket-draw is pending', () => {
    const s = { ...gameInPlay(), pendingTicketDraw: { playerId: 'a', offered: [], minKeep: 1 } };
    expect(canDrawBlind(s, 'a').allowed).toBe(false);
    expect(canDrawBlind(s, 'a').reason).toMatch(/ticket/i);
  });

  it('allows blind draw on the active turn', () => {
    const s = gameInPlay();
    expect(canDrawBlind(s, s.turn).allowed).toBe(true);
  });
});

describe('canDrawFaceUp', () => {
  it('denies face-up rainbow on second card', () => {
    const s = {
      ...gameInPlay(),
      pendingSecondCard: true,
      faceUp: ['rainbow', 'red', 'red', 'red', 'red'] as const,
    };
    expect(canDrawFaceUp(s as unknown as GameState, s.turn, 0).allowed).toBe(false);
  });

  it('allows face-up non-rainbow on second card', () => {
    const s = {
      ...gameInPlay(),
      pendingSecondCard: true,
      faceUp: ['red', 'rainbow', 'rainbow', 'rainbow', 'rainbow'] as const,
    };
    expect(canDrawFaceUp(s as unknown as GameState, s.turn, 0).allowed).toBe(true);
  });
});

describe('canClaimRoute', () => {
  it('denies if not enough train cars', () => {
    const s = gameInPlay();
    const route = hannoverMap.routes.find((r) => r.length === 6)!;
    const broke = {
      ...s,
      players: s.players.map((p) => (p.id === s.turn ? { ...p, trainCars: 3 } : p)),
    };
    expect(canClaimRoute(broke, broke.turn, route.id).reason).toMatch(/train cars/i);
  });

  it('denies if already claimed', () => {
    const s = gameInPlay();
    const route = hannoverMap.routes[0]!;
    const taken = {
      ...s,
      players: s.players.map((p) => ({
        ...p,
        claimedRoutes: p.id === s.turn ? [] : [route.id],
      })),
    };
    expect(canClaimRoute(taken, taken.turn, route.id).reason).toMatch(/already claimed/i);
  });

  it('denies parallel route at 2 players when first half is taken', () => {
    const s = gameInPlay();
    const pair = hannoverMap.routes.find((r) => r.parallel)!;
    const taken = {
      ...s,
      players: s.players.map((p) => ({
        ...p,
        claimedRoutes: p.id === s.turn ? [] : [pair.id],
      })),
    };
    expect(canClaimRoute(taken, taken.turn, pair.parallel!).reason).toMatch(/<4 players/);
  });
});

describe('validSpendOptions', () => {
  it('returns single-color spend for a colored route', () => {
    const s = gameInPlay();
    const route = hannoverMap.routes.find((r) => r.color === 'red' && r.length === 4)!;
    const flush = {
      ...s,
      players: s.players.map((p) =>
        p.id === s.turn ? { ...p, hand: { ...emptyHand(), red: 5 } } : p,
      ),
    };
    const opts = validSpendOptions(flush, flush.turn, route.id);
    expect(opts).toContainEqual(['red', 'red', 'red', 'red']);
    expect(opts.every((o) => o.length === 4)).toBe(true);
  });

  it('offers rainbow substitution for colored routes', () => {
    const s = gameInPlay();
    const route = hannoverMap.routes.find((r) => r.color === 'red' && r.length === 4)!;
    const mixed = {
      ...s,
      players: s.players.map((p) =>
        p.id === s.turn ? { ...p, hand: { ...emptyHand(), red: 3, rainbow: 1 } } : p,
      ),
    };
    const opts = validSpendOptions(mixed, mixed.turn, route.id);
    expect(opts).toContainEqual(['red', 'red', 'red', 'rainbow']);
  });

  it('offers every solid color for a gray route', () => {
    const s = gameInPlay();
    const route = hannoverMap.routes.find((r) => r.color === 'gray' && r.length === 2)!;
    const mixed = {
      ...s,
      players: s.players.map((p) =>
        p.id === s.turn ? { ...p, hand: { ...emptyHand(), red: 2, blue: 2 } } : p,
      ),
    };
    const opts = validSpendOptions(mixed, mixed.turn, route.id);
    expect(opts).toContainEqual(['red', 'red']);
    expect(opts).toContainEqual(['blue', 'blue']);
    // Cannot mix two different solid colors on a gray route.
    expect(opts.find((o) => new Set(o).size === 2 && !o.includes('rainbow'))).toBeUndefined();
  });

  it('returns no options when hand is empty', () => {
    const s = gameInPlay();
    const route = hannoverMap.routes[0]!;
    const broke = {
      ...s,
      players: s.players.map((p) => (p.id === s.turn ? { ...p, hand: emptyHand() } : p)),
    };
    expect(validSpendOptions(broke, broke.turn, route.id)).toHaveLength(0);
  });
});
