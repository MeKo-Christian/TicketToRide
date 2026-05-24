import { describe, expect, it } from 'vitest';
import { totalCards } from './invariants.js';
import { reduce } from './reduce.js';
import { initialState } from './state.js';
import { defaultConfig } from './test-fixtures.js';
import type { Ticket } from './types.js';

describe('setup: initial ticket selection', () => {
  it('each player must KeepTickets (≥ 2) in turn before phase becomes play', () => {
    const cfg = defaultConfig(3, 5);
    let s = initialState(cfg);
    expect(s.phase).toBe('setup');

    const playerIds = cfg.players.map((p) => p.id);
    for (const pid of playerIds) {
      expect(s.pendingTicketDraw?.playerId).toBe(pid);
      const offered = s.pendingTicketDraw?.offered as Ticket[];
      expect(offered.length).toBe(3);
      // Keep first 2
      s = reduce(s, { type: 'KeepTickets', playerId: pid, keep: [offered[0]!.id, offered[1]!.id] });
    }
    expect(s.phase).toBe('play');
    expect(s.pendingTicketDraw).toBeUndefined();
    expect(s.turn).toBe(playerIds[0]);
    expect(totalCards(s)).toBe(110);
  });

  it('rejects KeepTickets when player keeps fewer than minKeep', () => {
    const cfg = defaultConfig(2, 11);
    let s = initialState(cfg);
    const pid = s.pendingTicketDraw!.playerId;
    const offered = s.pendingTicketDraw!.offered;
    const before = s;
    s = reduce(s, { type: 'KeepTickets', playerId: pid, keep: [offered[0]!.id] });
    expect(s.pendingTicketDraw).toEqual(before.pendingTicketDraw);
    expect(s.log.at(-1)?.type).toBe('invalid');
  });

  it('rejects KeepTickets with ids not in the offered set', () => {
    const cfg = defaultConfig(2, 12);
    let s = initialState(cfg);
    const pid = s.pendingTicketDraw!.playerId;
    s = reduce(s, { type: 'KeepTickets', playerId: pid, keep: ['nope-1', 'nope-2'] });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });
});
