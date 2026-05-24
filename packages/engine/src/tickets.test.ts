import { describe, expect, it } from 'vitest';
import { reduce } from './reduce.js';
import { gameInPlay } from './test-helpers.js';

describe('DrawTickets mid-game', () => {
  it('offers up to 3 tickets and requires at least 1 kept', () => {
    let s = gameInPlay(2, 50);
    const pid = s.turn;
    s = reduce(s, { type: 'DrawTickets', playerId: pid });
    expect(s.pendingTicketDraw?.playerId).toBe(pid);
    expect(s.pendingTicketDraw?.minKeep).toBe(1);
    expect(s.pendingTicketDraw?.offered.length).toBeGreaterThanOrEqual(1);
    expect(s.pendingTicketDraw?.offered.length).toBeLessThanOrEqual(3);
    // Player can't act until they resolve the pending draw.
    const before = s.log.length;
    s = reduce(s, { type: 'DrawBlind', playerId: pid });
    expect(s.log[before]?.type).toBe('invalid');
  });

  it('KeepTickets keeps the chosen ones and ends the turn', () => {
    let s = gameInPlay(2, 51);
    const pid = s.turn;
    s = reduce(s, { type: 'DrawTickets', playerId: pid });
    const offered = s.pendingTicketDraw!.offered;
    const kept = [offered[0]!.id];
    s = reduce(s, { type: 'KeepTickets', playerId: pid, keep: kept });
    expect(s.turn).not.toBe(pid);
    expect(s.pendingTicketDraw).toBeUndefined();
    const player = s.players.find((p) => p.id === pid)!;
    expect(player.tickets.map((t) => t.id)).toContain(kept[0]);
  });

  it('rejects DrawTickets when none remain in the ticket deck', () => {
    let s = gameInPlay(2, 52);
    // drain the ticket deck
    s = { ...s, ticketDeck: [] };
    const pid = s.turn;
    s = reduce(s, { type: 'DrawTickets', playerId: pid });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });
});
