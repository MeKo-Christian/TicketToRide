import { describe, expect, it } from 'vitest';
import { COLORED_CARDS, RAINBOW_CARDS, TRAIN_DECK_SIZE, buildTrainDeck } from './deck.js';
import { TRAIN_CARD_COLORS } from './types.js';

describe('train deck', () => {
  it('contains 110 cards: 12 per color + 14 rainbows', () => {
    const deck = buildTrainDeck();
    expect(deck.length).toBe(TRAIN_DECK_SIZE);
    expect(deck.length).toBe(110);

    const counts = deck.reduce<Record<string, number>>((acc, c) => {
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {});

    for (const c of TRAIN_CARD_COLORS) {
      if (c === 'rainbow') {
        expect(counts[c]).toBe(RAINBOW_CARDS);
        expect(counts[c]).toBe(14);
      } else {
        expect(counts[c]).toBe(COLORED_CARDS);
        expect(counts[c]).toBe(12);
      }
    }
  });

  it('lists exactly nine card colors including rainbow', () => {
    expect(TRAIN_CARD_COLORS.length).toBe(9);
    expect(TRAIN_CARD_COLORS).toContain('rainbow');
  });
});
