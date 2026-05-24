import { describe, expect, it } from 'vitest';
import { reduce } from './reduce.js';
import { finalScores } from './scoring.js';
import { gameInPlay } from './test-helpers.js';
import type { GameState } from './types.js';

function setCars(s: GameState, playerId: string, cars: number): GameState {
  return {
    ...s,
    players: s.players.map((p) => (p.id === playerId ? { ...p, trainCars: cars } : p)),
  };
}

function setHand(
  s: GameState,
  playerId: string,
  color: 'red' | 'blue' | 'green' | 'yellow',
  n: number,
): GameState {
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
              [color]: n,
            },
          }
        : p,
    ),
  };
}

describe('last-round trigger', () => {
  it('claiming a route that drops trainCars ≤ 2 triggers lastRound, then ends after one full lap', () => {
    let s = gameInPlay(2, 60);
    const p1 = s.turn;
    const p2 = s.players.find((p) => p.id !== p1)!.id;

    s = setCars(s, p1, 3);
    s = setHand(s, p1, 'red', 5);
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'BC-red-3',
      spent: ['red', 'red', 'red'],
    });
    expect(s.phase).toBe('lastRound');
    expect(s.lastRoundTrigger).toBe(p1);
    // p2 still gets one more turn
    expect(s.turn).toBe(p2);

    // p2 ends their turn (drawing 2 cards).
    s = reduce(s, { type: 'DrawBlind', playerId: p2 });
    s = reduce(s, { type: 'DrawBlind', playerId: p2 });
    expect(s.phase).toBe('finished');
  });
});

describe('finalScores', () => {
  it('adds completed-ticket points and subtracts uncompleted ones', () => {
    let s = gameInPlay(2, 70);
    const p1 = s.turn;
    s = setHand(s, p1, 'blue', 5);
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });

    // Award p1 a ticket they have completed (A-B, satisfied by the route just claimed)
    // and an unmet ticket (D-E).
    s = {
      ...s,
      players: s.players.map((p) =>
        p.id === p1
          ? {
              ...p,
              tickets: [
                { id: 'won', from: 'A', to: 'B', points: 2 },
                { id: 'lost', from: 'D', to: 'E', points: 6 },
              ],
            }
          : p,
      ),
    };

    const scores = finalScores(s);
    const p1Score = scores.find((x) => x.playerId === p1)!;
    // Route: 2 pts. Tickets: +2 (won) -6 (lost) = -4. Total = -2 (before longest path).
    expect(p1Score.routePoints).toBe(2);
    expect(p1Score.ticketPoints).toBe(2 - 6);
    expect(p1Score.total).toBe(
      p1Score.routePoints + p1Score.ticketPoints + p1Score.longestPathBonus,
    );
  });

  it('awards longest-path bonus (10) to player with the longest contiguous edge sequence', () => {
    let s = gameInPlay(2, 71);
    const p1 = s.turn;
    const p2 = s.players.find((p) => p.id !== p1)!.id;

    s = setHand(s, p1, 'blue', 5);
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });
    s = setHand(s, p2, 'red', 5);
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p2,
      routeId: 'BC-red-3',
      spent: ['red', 'red', 'red'],
    });

    const scores = finalScores(s);
    const p1Score = scores.find((x) => x.playerId === p1)!;
    const p2Score = scores.find((x) => x.playerId === p2)!;
    // p2's single route is length 3 (longer); p1's is length 2.
    expect(p2Score.longestPathBonus).toBe(10);
    expect(p1Score.longestPathBonus).toBe(0);
    expect(p2Score.longestPath).toBe(3);
  });

  it('ties on longest path share the bonus', () => {
    let s = gameInPlay(2, 72);
    const p1 = s.turn;
    const p2 = s.players.find((p) => p.id !== p1)!.id;

    s = setHand(s, p1, 'blue', 5);
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p1,
      routeId: 'AB-blue-2',
      spent: ['blue', 'blue'],
    });
    s = setHand(s, p2, 'yellow', 5);
    s = reduce(s, {
      type: 'ClaimRoute',
      playerId: p2,
      routeId: 'CE-yellow-2-a',
      spent: ['yellow', 'yellow'],
    });

    const scores = finalScores(s);
    expect(scores.every((x) => x.longestPathBonus === 10)).toBe(true);
  });
});
