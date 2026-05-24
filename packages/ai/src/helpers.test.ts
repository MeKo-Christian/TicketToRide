import type { GameConfig, GameState, Hand } from '@ttr/engine';
import { initialState, reduce } from '@ttr/engine';
import { hannoverMap } from '@ttr/map-data';
import { describe, expect, it } from 'vitest';
import {
  claimableRoutes,
  neededColors,
  routesOnTicketPaths,
  satisfiedTickets,
  shortestUsableRoute,
} from './helpers.js';

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
    seed: 11,
    map: hannoverMap,
    players: [
      { id: 'a', name: 'A', color: 'red', isAI: true },
      { id: 'b', name: 'B', color: 'blue', isAI: true },
    ],
  };
  let s = initialState(cfg);
  while (s.phase === 'setup' && s.pendingTicketDraw) {
    s = reduce(s, {
      type: 'KeepTickets',
      playerId: s.pendingTicketDraw.playerId,
      keep: s.pendingTicketDraw.offered.slice(0, 2).map((t) => t.id),
    });
  }
  return s;
}

describe('claimableRoutes', () => {
  it('returns nothing when not your turn', () => {
    const s = gameInPlay();
    const other = s.players.find((p) => p.id !== s.turn)!.id;
    expect(claimableRoutes(s, other)).toHaveLength(0);
  });

  it('returns nothing when hand is empty', () => {
    const s = gameInPlay();
    const stripped = {
      ...s,
      players: s.players.map((p) => (p.id === s.turn ? { ...p, hand: emptyHand() } : p)),
    };
    expect(claimableRoutes(stripped, stripped.turn)).toHaveLength(0);
  });

  it('returns routes when player has matching cards', () => {
    const s = gameInPlay();
    const flush = {
      ...s,
      players: s.players.map((p) =>
        p.id === s.turn ? { ...p, hand: { ...emptyHand(), red: 6, blue: 6 } } : p,
      ),
    };
    const claims = claimableRoutes(flush, flush.turn);
    expect(claims.length).toBeGreaterThan(0);
    for (const c of claims) {
      expect(c.spend.length).toBe(c.route.length);
    }
  });
});

describe('shortestUsableRoute', () => {
  it('cost 0 for same station', () => {
    const s = gameInPlay();
    expect(shortestUsableRoute(s, s.turn, 'hbf', 'hbf').cost).toBe(0);
  });

  it('returns a valid path between connected stations', () => {
    const s = gameInPlay();
    const { cost, routes } = shortestUsableRoute(s, s.turn, 'hbf', 'kroepcke');
    expect(cost).toBeGreaterThan(0);
    expect(routes.length).toBeGreaterThan(0);
  });

  it('avoids routes owned by other players', () => {
    const s = gameInPlay();
    const other = s.players.find((p) => p.id !== s.turn)!.id;
    // Block both Hbf↔Kröpcke parallels under "other".
    const blocked = {
      ...s,
      players: s.players.map((p) =>
        p.id === other
          ? {
              ...p,
              claimedRoutes: ['hbf-kroepcke-red-1', 'hbf-kroepcke-blue-1'],
            }
          : p,
      ),
    };
    const { routes } = shortestUsableRoute(blocked, blocked.turn, 'hbf', 'kroepcke');
    expect(routes).not.toContain('hbf-kroepcke-red-1');
    expect(routes).not.toContain('hbf-kroepcke-blue-1');
  });
});

describe('routesOnTicketPaths', () => {
  it('includes routes from at least one ticket', () => {
    const s = gameInPlay();
    const set = routesOnTicketPaths(s, s.turn);
    const player = s.players.find((p) => p.id === s.turn)!;
    if (player.tickets.length > 0) expect(set.size).toBeGreaterThan(0);
  });
});

describe('satisfiedTickets', () => {
  it('treats a connected-via-owned-routes ticket as satisfied', () => {
    const s = gameInPlay();
    const player = s.players.find((p) => p.id === s.turn)!;
    const synthetic = {
      ...s,
      players: s.players.map((p) =>
        p.id === player.id
          ? {
              ...p,
              claimedRoutes: ['hbf-kroepcke-red-1'],
              tickets: [{ id: 't', from: 'hbf', to: 'kroepcke', points: 3 }],
            }
          : p,
      ),
    };
    expect(satisfiedTickets(synthetic, player.id).map((t) => t.id)).toContain('t');
  });
});

describe('neededColors', () => {
  it('non-negative, drops to zero once hand covers the colour', () => {
    const s = gameInPlay();
    const flush = {
      ...s,
      players: s.players.map((p) =>
        p.id === s.turn ? { ...p, hand: { ...emptyHand(), red: 50 } } : p,
      ),
    };
    const need = neededColors(flush, flush.turn);
    expect(need.red).toBe(0);
    for (const v of Object.values(need)) expect(v).toBeGreaterThanOrEqual(0);
  });
});
