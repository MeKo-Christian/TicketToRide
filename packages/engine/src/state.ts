import { buildTrainDeck, emptyHand } from './deck.js';
import { createRng } from './rng.js';
import type { GameConfig, GameState, PlayerState, Ticket, TrainCardColor } from './types.js';

const INITIAL_TRAIN_CARS = 45;
const INITIAL_HAND_SIZE = 4;
const FACE_UP_SIZE = 5;
const INITIAL_TICKETS_OFFERED = 3;
const INITIAL_TICKETS_MIN_KEEP = 2;

export function initialState(cfg: GameConfig): GameState {
  if (cfg.players.length < 2 || cfg.players.length > 5) {
    throw new Error(`Player count must be 2-5, got ${cfg.players.length}`);
  }
  const rng = createRng(cfg.seed);

  const deck = rng.shuffle(buildTrainDeck());
  const ticketDeck = rng.shuffle([...cfg.map.tickets]);

  const players: PlayerState[] = cfg.players.map((p) => {
    const hand = emptyHand();
    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      const card = deck.pop() as TrainCardColor;
      hand[card]++;
    }
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      isAI: p.isAI,
      trainCars: INITIAL_TRAIN_CARS,
      hand,
      tickets: [],
      claimedRoutes: [],
      score: 0,
    };
  });

  const faceUp: TrainCardColor[] = [];
  for (let i = 0; i < FACE_UP_SIZE; i++) faceUp.push(deck.pop() as TrainCardColor);

  // First player gets the first pending ticket draw.
  const firstPlayer = cfg.players[0];
  if (!firstPlayer) throw new Error('No players configured');
  const offered: Ticket[] = [];
  for (let i = 0; i < INITIAL_TICKETS_OFFERED && ticketDeck.length > 0; i++) {
    offered.push(ticketDeck.pop() as Ticket);
  }

  const state: GameState = {
    map: cfg.map,
    players,
    turn: firstPlayer.id,
    pendingSecondCard: false,
    pendingTicketDraw: {
      playerId: firstPlayer.id,
      offered,
      minKeep: INITIAL_TICKETS_MIN_KEEP,
    },
    phase: 'setup',
    trainDeck: deck,
    faceUp,
    discardPile: [],
    ticketDeck,
    ticketDiscard: [],
    rngSeed: cfg.seed,
    rngState: rng.state(),
    log: [{ id: 0, type: 'gameStarted', firstPlayer: firstPlayer.id }],
    nextEventId: 1,
  };

  return state;
}
