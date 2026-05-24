export const ENGINE_VERSION = '0.1.0';

export type { Action } from './actions.js';
export { COLORED_CARDS, RAINBOW_CARDS, TRAIN_DECK_SIZE, buildTrainDeck } from './deck.js';
export { totalCards } from './invariants.js';
export { reduce } from './reduce.js';
export { createRng, type Rng } from './rng.js';
export {
  LONGEST_PATH_BONUS,
  finalScores,
  type PlayerScore,
} from './scoring.js';
export { initialState } from './state.js';
export {
  PLAYER_COLORS,
  SOLID_COLORS,
  TRAIN_CARD_COLORS,
  type GameConfig,
  type GameEvent,
  type GameState,
  type Hand,
  type MapData,
  type Phase,
  type PlayerColor,
  type PlayerId,
  type PlayerState,
  type Route,
  type RouteId,
  type SolidColor,
  type Station,
  type StationId,
  type Ticket,
  type TicketId,
  type TrainCardColor,
} from './types.js';
