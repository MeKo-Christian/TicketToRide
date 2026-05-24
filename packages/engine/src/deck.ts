import { SOLID_COLORS, type TrainCardColor } from './types.js';

export const COLORED_CARDS = 12;
export const RAINBOW_CARDS = 14;
export const TRAIN_DECK_SIZE = SOLID_COLORS.length * COLORED_CARDS + RAINBOW_CARDS;

export function buildTrainDeck(): TrainCardColor[] {
  const deck: TrainCardColor[] = [];
  for (const c of SOLID_COLORS) {
    for (let i = 0; i < COLORED_CARDS; i++) deck.push(c);
  }
  for (let i = 0; i < RAINBOW_CARDS; i++) deck.push('rainbow');
  return deck;
}

export function emptyHand(): Record<TrainCardColor, number> {
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
