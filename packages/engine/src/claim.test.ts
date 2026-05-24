import { describe, expect, it } from 'vitest';
import { totalCards } from './invariants.js';
import { reduce } from './reduce.js';
import { gameInPlay } from './test-helpers.js';
import type { GameState, Hand, TrainCardColor } from './types.js';

function setHand(s: GameState, playerId: string, hand: Partial<Hand>): GameState {
  return {
    ...s,
    players: s.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hand: {
              red: 0,
              orange: 0,
              yellow: 0,
              green: 0,
              blue: 0,
              pink: 0,
              white: 0,
              black: 0,
              rainbow: 0,
              ...hand,
            },
          }
        : p,
    ),
  };
}

describe('ClaimRoute', () => {
  it('claims a colored route paying exact-color cards', () => {
    let s = gameInPlay(2, 21);
    const pid = s.turn;
    s = setHand(s, pid, { blue: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });
    const player = s.players.find((p) => p.id === pid)!;
    expect(player.claimedRoutes).toContain('AB-blue-2');
    expect(player.trainCars).toBe(45 - 2);
    expect(player.score).toBe(2); // length 2 = 2 pts
    expect(player.hand.blue).toBe(3);
    expect(s.discardPile.length).toBe(2);
    expect(s.turn).not.toBe(pid); // claim ends turn
    // totalCards invariant not checked: setHand replaces the dealt hand for test setup
  });

  it('claims with rainbow substitutes for a colored route', () => {
    let s = gameInPlay(2, 22);
    const pid = s.turn;
    s = setHand(s, pid, { red: 1, rainbow: 2 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'BC-red-3',
      spent: ['red', 'rainbow', 'rainbow'],
    });
    const player = s.players.find((p) => p.id === pid)!;
    expect(player.claimedRoutes).toContain('BC-red-3');
    expect(player.score).toBe(4); // length 3 = 4 pts
  });

  it('claims a gray route with any single color', () => {
    let s = gameInPlay(2, 23);
    const pid = s.turn;
    s = setHand(s, pid, { green: 1 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'BD-gray-1',
      spent: ['green'],
    });
    expect(s.players.find((p) => p.id === pid)!.score).toBe(1);
  });

  it('rejects mixed colors on a gray route', () => {
    let s = gameInPlay(2, 24);
    const pid = s.turn;
    s = setHand(s, pid, { red: 1, blue: 1, green: 1, yellow: 1, black: 1, white: 1 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'DE-gray-6',
      spent: ['red', 'blue', 'green', 'yellow', 'black', 'white'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('rejects wrong colors on a solid-color route', () => {
    let s = gameInPlay(2, 25);
    const pid = s.turn;
    s = setHand(s, pid, { red: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'AB-blue-2',
      spent: ['red', 'red'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('rejects spending cards the player does not own', () => {
    let s = gameInPlay(2, 26);
    const pid = s.turn;
    s = setHand(s, pid, { blue: 1 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('rejects claim with wrong number of cards', () => {
    let s = gameInPlay(2, 27);
    const pid = s.turn;
    s = setHand(s, pid, { blue: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'AB-blue-2',
      spent: ['blue'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('rejects claim when not enough train cars left', () => {
    let s = gameInPlay(2, 28);
    const pid = s.turn;
    s = setHand(s, pid, { red: 5 });
    s = {
      ...s,
      players: s.players.map((p) => (p.id === pid ? { ...p, trainCars: 1 } : p)),
    };
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: pid,
      routeId: 'BC-red-3',
      spent: ['red', 'red', 'red'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('rejects claiming an already-claimed route', () => {
    let s = gameInPlay(2, 29);
    const p1 = s.turn;
    s = setHand(s, p1, { blue: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });
    const p2 = s.turn;
    s = setHand(s, p2, { blue: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p2,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('blocks a player from claiming both parallels of a double route', () => {
    let s = gameInPlay(2, 30); // 2 players: parallels disabled entirely
    const p1 = s.turn;
    s = setHand(s, p1, { yellow: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'CE-yellow-2-a',
      spent: ['yellow', 'yellow'],
    });
    expect(s.players.find((p) => p.id === p1)!.claimedRoutes).toContain('CE-yellow-2-a');
    const p2 = s.turn;
    s = setHand(s, p2, { black: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p2,
      routeId: 'CE-yellow-2-b',
      spent: ['black', 'black'],
    });
    // At 2-3 players, the second parallel is forbidden entirely
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('allows a different player to claim the parallel at 4+ players', () => {
    let s = gameInPlay(4, 31);
    const p1 = s.turn;
    s = setHand(s, p1, { yellow: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'CE-yellow-2-a',
      spent: ['yellow', 'yellow'],
    });
    const p2 = s.turn;
    s = setHand(s, p2, { black: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p2,
      routeId: 'CE-yellow-2-b',
      spent: ['black', 'black'],
    });
    expect(s.players.find((p) => p.id === p2)!.claimedRoutes).toContain('CE-yellow-2-b');
  });

  it('blocks the same player from claiming both parallels even at 4+ players', () => {
    let s = gameInPlay(4, 32);
    const p1 = s.turn;
    s = setHand(s, p1, { yellow: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'CE-yellow-2-a',
      spent: ['yellow', 'yellow'],
    });
    // jump back to p1 turn by setting the turn manually
    s = { ...s, turn: p1, pendingSecondCard: false };
    s = setHand(s, p1, { black: 5 });
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'CE-yellow-2-b',
      spent: ['black', 'black'],
    });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });
});

describe('route scoring by length', () => {
  const cases: { length: number; pts: number }[] = [
    { length: 1, pts: 1 },
    { length: 2, pts: 2 },
    { length: 3, pts: 4 },
    { length: 4, pts: 7 },
    { length: 6, pts: 15 },
  ];
  it.each(cases)('length $length scores $pts', ({ length, pts }) => {
    let s = gameInPlay(2, 40 + length);
    const pid = s.turn;
    const routeId =
      length === 1
        ? 'BD-gray-1'
        : length === 2
          ? 'AB-blue-2'
          : length === 3
            ? 'BC-red-3'
            : length === 4
              ? 'CD-green-4'
              : 'DE-gray-6';
    const route = s.map.routes.find((r) => r.id === routeId)!;
    const color: TrainCardColor = route.color === 'gray' ? 'red' : route.color;
    const spent: TrainCardColor[] = Array.from({ length }, () => color);
    const hand: Partial<Hand> = { [color]: length };
    s = setHand(s, pid, hand);
    s = reduce(s, { type: 'ClaimRoute', playerId: pid, routeId, spent });
    expect(s.players.find((p) => p.id === pid)!.score).toBe(pts);
  });
});
