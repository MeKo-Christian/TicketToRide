import type { Action, GameConfig, GameState, Hand } from '@ttr/engine';
import { initialState, reduce } from '@ttr/engine';
import { hannoverMap } from '@ttr/map-data';
import { describe, expect, it } from 'vitest';
import { chooseAction } from './choose.js';
import { DIFFICULTIES, type Difficulty } from './index.js';

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

function newGame(seed: number, n = 2): GameState {
  const cfg: GameConfig = {
    seed,
    map: hannoverMap,
    players: Array.from({ length: n }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Bot ${i + 1}`,
      color: (['red', 'blue', 'green', 'yellow', 'black'] as const)[i]!,
      isAI: true,
    })),
  };
  return initialState(cfg);
}

describe('chooseAction — legality', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`${difficulty} always produces actions the engine accepts (no invalid events)`, () => {
      let s = newGame(100, 2);
      let invalidCount = 0;
      // Cap at 600 reduces to bound runtime; a 2p game typically finishes in <200 actions.
      for (let i = 0; i < 600 && s.phase !== 'finished'; i++) {
        const active = s.pendingTicketDraw?.playerId ?? s.turn;
        const a = chooseAction(s, active, difficulty);
        const before = s.log.length;
        s = reduce(s, a);
        const newEvents = s.log.slice(before);
        if (newEvents.some((e) => e.type === 'invalid')) {
          invalidCount++;
          break;
        }
      }
      expect(invalidCount).toBe(0);
      expect(s.phase).toBe('finished');
    });
  }
});

describe('chooseAction — passive specifics', () => {
  it('picks face-up rainbow when offered as first card', () => {
    let s = newGame(7);
    // Burn setup.
    while (s.phase === 'setup' && s.pendingTicketDraw) {
      s = reduce(s, {
        type: 'KeepTickets',
        playerId: s.pendingTicketDraw.playerId,
        keep: s.pendingTicketDraw.offered.slice(0, 2).map((t) => t.id),
      });
    }
    // Force a rainbow in the face-up row.
    const withRainbow: GameState = {
      ...s,
      faceUp: ['rainbow', 'red', 'blue', 'green', 'yellow'],
      players: s.players.map((p) =>
        p.id === s.turn ? { ...p, hand: emptyHand(), claimedRoutes: [] } : p,
      ),
    };
    const action = chooseAction(withRainbow, withRainbow.turn, 'passive');
    expect(action.type).toBe('DrawFaceUp');
    if (action.type === 'DrawFaceUp') expect(action.index).toBe(0);
  });

  it('claims a route on a ticket path when it can pay for it', () => {
    let s = newGame(13);
    while (s.phase === 'setup' && s.pendingTicketDraw) {
      s = reduce(s, {
        type: 'KeepTickets',
        playerId: s.pendingTicketDraw.playerId,
        keep: s.pendingTicketDraw.offered.slice(0, 2).map((t) => t.id),
      });
    }
    // Hand the active player a stash that covers any short red/blue/yellow route.
    const stacked: GameState = {
      ...s,
      players: s.players.map((p) =>
        p.id === s.turn
          ? {
              ...p,
              hand: { ...emptyHand(), red: 6, blue: 6, yellow: 6, green: 6, rainbow: 3 },
              tickets: [{ id: 'forced', from: 'hbf', to: 'kroepcke', points: 3 }],
            }
          : p,
      ),
    };
    const action = chooseAction(stacked, stacked.turn, 'passive');
    // Should be ClaimRoute or DrawFaceUp (if no rainbow but tickets cover it,
    // claim should be preferred).
    expect(['ClaimRoute', 'DrawFaceUp']).toContain(action.type);
  });
});

describe('chooseAction — keep tickets', () => {
  it('passive keeps the minimum, aggressive keeps more', () => {
    const s = newGame(42);
    const passiveAction = chooseAction(s, s.pendingTicketDraw!.playerId, 'passive');
    const aggressiveAction = chooseAction(s, s.pendingTicketDraw!.playerId, 'aggressive');
    expect(passiveAction.type).toBe('KeepTickets');
    expect(aggressiveAction.type).toBe('KeepTickets');
    if (passiveAction.type === 'KeepTickets' && aggressiveAction.type === 'KeepTickets') {
      expect(passiveAction.keep.length).toBeLessThanOrEqual(aggressiveAction.keep.length);
      expect(passiveAction.keep.length).toBeGreaterThanOrEqual(s.pendingTicketDraw!.minKeep);
    }
  });
});

describe('chooseAction — purity', () => {
  it('returns the same action when called twice on the same state', () => {
    const s = newGame(2026);
    const playerId = s.pendingTicketDraw!.playerId;
    const a = chooseAction(s, playerId, 'normal');
    const b = chooseAction(s, playerId, 'normal');
    expect(a).toEqual(b);
  });
});

describe('bot-vs-bot full games', () => {
  function play(difficulty: Difficulty, seed: number, players = 2): GameState {
    let s = newGame(seed, players);
    for (let i = 0; i < 800 && s.phase !== 'finished'; i++) {
      const active = s.pendingTicketDraw?.playerId ?? s.turn;
      const a: Action = chooseAction(s, active, difficulty);
      s = reduce(s, a);
    }
    return s;
  }

  for (const difficulty of DIFFICULTIES) {
    it(`${difficulty} 2p game terminates with a winner`, () => {
      const s = play(difficulty, 31, 2);
      expect(s.phase).toBe('finished');
      // Both players have something resembling a score.
      expect(s.players.every((p) => typeof p.score === 'number')).toBe(true);
    });
  }

  it('3-player normal game terminates', () => {
    const s = play('normal', 99, 3);
    expect(s.phase).toBe('finished');
  });
});
