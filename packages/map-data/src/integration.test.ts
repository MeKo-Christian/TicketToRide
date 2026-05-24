import { type GameConfig, initialState, totalCards } from '@ttr/engine';
import { describe, expect, it } from 'vitest';
import { MAPS } from './index.js';

function config(mapId: string, n: 2 | 3 | 4 | 5, seed: number): GameConfig {
  const palette = ['red', 'blue', 'green', 'yellow', 'black'] as const;
  return {
    seed,
    map: MAPS.find((m) => m.id === mapId)!.map,
    players: Array.from({ length: n }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      color: palette[i]!,
      isAI: false,
    })),
  };
}

for (const { id, name } of MAPS) {
  describe(`${name} (${id}) × engine integration`, () => {
    for (const n of [2, 3, 4, 5] as const) {
      it(`initialState works for ${n} players (no throw, deck/hand invariant holds)`, () => {
        const s = initialState(config(id, n, 100 + n));
        expect(s.players).toHaveLength(n);
        expect(totalCards(s)).toBe(110);
        // First player has a pending ticket draw with 3 offered.
        expect(s.pendingTicketDraw).toBeDefined();
        expect(s.pendingTicketDraw?.offered).toHaveLength(3);
      });
    }

    it('initial ticket deck has enough tickets to deal 3 to every player', () => {
      const s = initialState(config(id, 5, 999));
      // 5 players × 3 offered = 15 tickets needed up front.
      expect(
        s.ticketDeck.length + (s.pendingTicketDraw?.offered.length ?? 0),
      ).toBeGreaterThanOrEqual(15);
    });
  });
}
