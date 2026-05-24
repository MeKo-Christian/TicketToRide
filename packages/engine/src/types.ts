export const TRAIN_CARD_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'pink',
  'white',
  'black',
  'rainbow',
] as const;
export type TrainCardColor = (typeof TRAIN_CARD_COLORS)[number];

export const SOLID_COLORS = TRAIN_CARD_COLORS.filter(
  (c): c is Exclude<TrainCardColor, 'rainbow'> => c !== 'rainbow',
);
export type SolidColor = (typeof SOLID_COLORS)[number];

/** Player tokens — limited to 6 to fit common TTR component counts. */
export const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow', 'black', 'white'] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];

export type StationId = string;
export type RouteId = string;
export type PlayerId = string;
export type TicketId = string;
export type EventId = number;

export interface Station {
  id: StationId;
  name: string;
  /** SVG layout x, not lat/lon. */
  x: number;
  y: number;
}

export interface Route {
  id: RouteId;
  a: StationId;
  b: StationId;
  /** 1-6. Cost to claim equals length. */
  length: number;
  /** A solid color requires matching cards; 'gray' accepts any single color. */
  color: SolidColor | 'gray';
  /** Stadtbahn line(s) for UI flavor. */
  line: number;
  /** Other half of a double route. Only usable at 4+ players. */
  parallel?: RouteId;
}

export interface Ticket {
  id: TicketId;
  from: StationId;
  to: StationId;
  points: number;
}

export type Hand = Record<TrainCardColor, number>;

export interface PlayerState {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  isAI: boolean;
  trainCars: number;
  hand: Hand;
  tickets: Ticket[];
  claimedRoutes: RouteId[];
  /** Running score, excludes ticket settlement and longest-path bonus. */
  score: number;
}

export type Phase = 'setup' | 'play' | 'lastRound' | 'finished';

export interface PendingTicketDraw {
  playerId: PlayerId;
  offered: Ticket[];
  minKeep: number;
}

export type GameEvent =
  | { id: EventId; type: 'gameStarted'; firstPlayer: PlayerId }
  | { id: EventId; type: 'drewBlind'; playerId: PlayerId; card: TrainCardColor }
  | { id: EventId; type: 'drewFaceUp'; playerId: PlayerId; card: TrainCardColor; index: number }
  | { id: EventId; type: 'faceUpReshuffled'; reason: 'threeRainbows' }
  | {
      id: EventId;
      type: 'claimedRoute';
      playerId: PlayerId;
      routeId: RouteId;
      spent: TrainCardColor[];
    }
  | { id: EventId; type: 'drewTickets'; playerId: PlayerId; offered: TicketId[] }
  | {
      id: EventId;
      type: 'keptTickets';
      playerId: PlayerId;
      kept: TicketId[];
      discarded: TicketId[];
    }
  | { id: EventId; type: 'turnEnded'; playerId: PlayerId }
  | { id: EventId; type: 'lastRoundTriggered'; playerId: PlayerId }
  | { id: EventId; type: 'gameFinished' }
  | { id: EventId; type: 'invalid'; playerId: PlayerId; reason: string };

export interface MapData {
  stations: Station[];
  routes: Route[];
  tickets: Ticket[];
}

export interface GameConfig {
  players: { id: PlayerId; name: string; color: PlayerColor; isAI: boolean }[];
  map: MapData;
  seed: number;
}

export interface GameState {
  map: MapData;
  players: PlayerState[];
  turn: PlayerId;
  /** When true, the active player must draw a second card before ending their turn. */
  pendingSecondCard: boolean;
  pendingTicketDraw?: PendingTicketDraw;
  phase: Phase;
  trainDeck: TrainCardColor[];
  faceUp: TrainCardColor[];
  discardPile: TrainCardColor[];
  ticketDeck: Ticket[];
  ticketDiscard: Ticket[];
  /** Player who triggered the last round, or undefined if not yet triggered. */
  lastRoundTrigger?: PlayerId;
  /** Number of turns remaining once the last round is triggered. */
  turnsRemaining?: number;
  rngSeed: number;
  /** Snapshot of RNG state, so reduce can be pure. */
  rngState: number;
  log: GameEvent[];
  nextEventId: EventId;
}
