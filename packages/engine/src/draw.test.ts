import { describe, expect, it } from 'vitest';
import { totalCards } from './invariants.js';
import { reduce } from './reduce.js';
import { gameInPlay } from './test-helpers.js';

describe('DrawBlind', () => {
  it('adds the top deck card to the active player and demands a second draw', () => {
    let s = gameInPlay(2, 3);
    const pid = s.turn;
    const handBefore = { ...s.players.find((p) => p.id === pid)!.hand };
    const top = s.trainDeck.at(-1)!;
    s = reduce(s, { type: 'DrawBlind', playerId: pid });
    const player = s.players.find((p) => p.id === pid)!;
    expect(player.hand[top]).toBe((handBefore[top] ?? 0) + 1);
    expect(s.pendingSecondCard).toBe(true);
    expect(s.turn).toBe(pid); // still their turn
    expect(totalCards(s)).toBe(110);
  });

  it('two blind draws end the turn', () => {
    let s = gameInPlay(2, 3);
    const pid = s.turn;
    s = reduce(s, { type: 'DrawBlind', playerId: pid });
    s = reduce(s, { type: 'DrawBlind', playerId: pid });
    expect(s.turn).not.toBe(pid);
    expect(s.pendingSecondCard).toBe(false);
    expect(totalCards(s)).toBe(110);
  });

  it('rejects draw from the wrong player', () => {
    let s = gameInPlay(2, 3);
    const other = s.players.find((p) => p.id !== s.turn)!.id;
    s = reduce(s, { type: 'DrawBlind', playerId: other });
    expect(s.log.at(-1)?.type).toBe('invalid');
  });
});

describe('DrawFaceUp', () => {
  it('replaces the drawn slot with a new card and prompts a second draw', () => {
    let s = gameInPlay(2, 3);
    const pid = s.turn;
    const idx = s.faceUp.findIndex((c) => c !== 'rainbow');
    expect(idx).toBeGreaterThanOrEqual(0);
    const drawn = s.faceUp[idx]!;
    s = reduce(s, { type: 'DrawFaceUp', playerId: pid, index: idx });
    const player = s.players.find((p) => p.id === pid)!;
    expect(player.hand[drawn]).toBeGreaterThanOrEqual(1);
    expect(s.faceUp.length).toBe(5);
    expect(s.pendingSecondCard).toBe(true);
    expect(s.turn).toBe(pid);
    expect(totalCards(s)).toBe(110);
  });

  it('drawing a face-up rainbow ends the turn immediately', () => {
    let s = gameInPlay(2, 3);
    // Inject a known rainbow at a known index for determinism.
    s = { ...s, faceUp: ['red', 'rainbow', 'blue', 'green', 'yellow'] };
    const pid = s.turn;
    s = reduce(s, { type: 'DrawFaceUp', playerId: pid, index: 1 });
    expect(s.turn).not.toBe(pid);
    expect(s.players.find((p) => p.id === pid)!.hand.rainbow).toBe(1);
  });

  it('cannot take a face-up rainbow as the second card of the turn', () => {
    let s = gameInPlay(2, 3);
    s = { ...s, faceUp: ['red', 'orange', 'blue', 'green', 'yellow'] };
    const pid = s.turn;
    s = reduce(s, { type: 'DrawFaceUp', playerId: pid, index: 0 });
    s = { ...s, faceUp: ['rainbow', 'orange', 'blue', 'green', 'yellow'] };
    const before = s.players.find((p) => p.id === pid)!.hand.rainbow;
    s = reduce(s, { type: 'DrawFaceUp', playerId: pid, index: 0 });
    expect(s.log.at(-1)?.type).toBe('invalid');
    expect(s.players.find((p) => p.id === pid)!.hand.rainbow).toBe(before);
  });

  it('reshuffles the face-up row when three rainbows appear', () => {
    let s = gameInPlay(2, 3);
    // Stack the discard pile with enough cards to refill if needed, and craft a face-up with 2 rainbows.
    s = {
      ...s,
      faceUp: ['rainbow', 'rainbow', 'blue', 'green', 'yellow'],
      // ensure the deck top is a rainbow so the replacement triggers a 3-rainbow reshuffle
      trainDeck: [...s.trainDeck.slice(0, -1), 'rainbow'],
    };
    const pid = s.turn;
    s = reduce(s, { type: 'DrawFaceUp', playerId: pid, index: 2 }); // drew blue, slot refills with top (rainbow)
    expect(s.log.some((e) => e.type === 'faceUpReshuffled')).toBe(true);
    // After reshuffle, fewer than 3 rainbows should remain face-up (unless deck is full of rainbows, which it isn't).
    const rainbows = s.faceUp.filter((c) => c === 'rainbow').length;
    expect(rainbows).toBeLessThan(3);
    expect(totalCards(s)).toBe(110);
  });
});
