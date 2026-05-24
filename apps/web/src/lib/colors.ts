import type { PlayerColor, TrainCardColor } from '@ttr/engine';

/** Card-face hex for SVG fills and HUD chips. */
export const CARD_HEX: Record<TrainCardColor, string> = {
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#facc15',
  green: '#16a34a',
  blue: '#2563eb',
  pink: '#ec4899',
  white: '#f8fafc',
  black: '#1e293b',
  rainbow: '#a855f7',
};

/** Hex for a route's gameplay color, including gray. */
export function routeStrokeHex(color: TrainCardColor | 'gray'): string {
  if (color === 'gray') return '#94a3b8';
  return CARD_HEX[color];
}

/** Text-readable label for a card colour (capitalised). */
export function cardLabel(c: TrainCardColor): string {
  return c[0]!.toUpperCase() + c.slice(1);
}

/** Hex used to outline a player's claimed routes & label their HUD. */
export const PLAYER_HEX: Record<PlayerColor, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  black: '#0f172a',
  white: '#e2e8f0',
};
