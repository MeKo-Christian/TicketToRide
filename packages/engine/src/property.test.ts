import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Action } from './actions.js';
import { totalCards } from './invariants.js';
import { reduce } from './reduce.js';
import { initialState } from './state.js';
import { defaultConfig } from './test-fixtures.js';
import type { GameState } from './types.js';

/**
 * Generate a sequence of arbitrary actions and assert that:
 *   - total card count remains 110 throughout,
 *   - no player ever has a negative card count,
 *   - turn never lands on an unknown player,
 *   - reduce never throws.
 *
 * Most random actions will be invalid; that's fine — invalid actions return
 * unchanged state with an 'invalid' log entry. The invariants must hold either way.
 */
describe('reduce: invariants under random action sequences', () => {
  it('preserves total card count and bounded structure', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('DrawBlind' as const),
              playerId: fc.constantFrom('p1', 'p2'),
            }),
            fc.record({
              type: fc.constant('DrawFaceUp' as const),
              playerId: fc.constantFrom('p1', 'p2'),
              index: fc.integer({ min: 0, max: 4 }),
            }),
            fc.record({
              type: fc.constant('DrawTickets' as const),
              playerId: fc.constantFrom('p1', 'p2'),
            }),
            fc.record({
              type: fc.constant('KeepTickets' as const),
              playerId: fc.constantFrom('p1', 'p2'),
              keep: fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
            }),
          ),
          { maxLength: 50 },
        ),
        (seed, actions) => {
          let s: GameState = initialState(defaultConfig(2, seed));
          for (const a of actions) {
            s = reduce(s, a as Action);
            expect(totalCards(s)).toBe(110);
            for (const p of s.players) {
              for (const v of Object.values(p.hand)) expect(v).toBeGreaterThanOrEqual(0);
            }
            expect(s.players.some((p) => p.id === s.turn)).toBe(true);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
