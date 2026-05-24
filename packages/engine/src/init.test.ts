import { describe, expect, it } from 'vitest';
import { totalCards } from './invariants.js';
import { initialState } from './state.js';
import { defaultConfig } from './test-fixtures.js';

describe('initialState', () => {
  it('deals 4 cards to each player, leaves 5 face-up, rest in deck', () => {
    const cfg = defaultConfig(3);
    const s = initialState(cfg);

    for (const p of s.players) {
      const sum = Object.values(p.hand).reduce((a, b) => a + b, 0);
      expect(sum).toBe(4);
      expect(p.trainCars).toBe(45);
      expect(p.score).toBe(0);
      expect(p.claimedRoutes).toEqual([]);
      // Pending ticket draw queued for each player during setup
    }

    expect(s.faceUp.length).toBe(5);
    expect(s.trainDeck.length).toBe(110 - 5 - cfg.players.length * 4);
    expect(s.discardPile).toEqual([]);
    expect(s.phase).toBe('setup');

    // The first player has a pending ticket draw (the others draw when their turn comes)
    expect(s.pendingTicketDraw?.playerId).toBe(s.players[0]?.id);
    expect(s.pendingTicketDraw?.offered.length).toBe(3);
    expect(s.pendingTicketDraw?.minKeep).toBe(2);

    expect(s.log[0]?.type).toBe('gameStarted');
  });

  it('is deterministic for a given seed', () => {
    const s1 = initialState(defaultConfig(3, 99));
    const s2 = initialState(defaultConfig(3, 99));
    expect(s1).toEqual(s2);
  });

  it('preserves card-count invariant (110 cards total)', () => {
    const s = initialState(defaultConfig(4));
    expect(totalCards(s)).toBe(110);
  });
});
