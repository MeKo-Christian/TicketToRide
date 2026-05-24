import type { GameState } from './types.js';

/** Count all train cards in the system. Should always equal 110 (deck size). */
export function totalCards(s: GameState): number {
  let total = s.trainDeck.length + s.faceUp.length + s.discardPile.length;
  for (const p of s.players) {
    for (const v of Object.values(p.hand)) total += v;
  }
  return total;
}
