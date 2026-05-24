import { reduce } from './reduce.js';
import { initialState } from './state.js';
import { defaultConfig } from './test-fixtures.js';
import type { GameState } from './types.js';

/** Build a game and skip the initial ticket selection — every player keeps the first 2. */
export function gameInPlay(n: number, seed = 1): GameState {
  let s = initialState(defaultConfig(n, seed));
  while (s.phase === 'setup') {
    const pid = s.pendingTicketDraw!.playerId;
    const offered = s.pendingTicketDraw!.offered;
    s = reduce(s, {
      type: 'KeepTickets',
      playerId: pid,
      keep: [offered[0]!.id, offered[1]!.id],
    });
  }
  return s;
}
