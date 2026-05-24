import type { Action } from './actions.js';
import { createRng } from './rng.js';
import type {
  GameEvent,
  GameState,
  PendingTicketDraw,
  PlayerState,
  Ticket,
  TrainCardColor,
} from './types.js';

const INITIAL_TICKETS_OFFERED = 3;
const INITIAL_TICKETS_MIN_KEEP = 2;

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'KeepTickets':
      return handleKeepTickets(state, action);
    case 'DrawBlind':
      return handleDrawBlind(state, action);
    case 'DrawFaceUp':
      return handleDrawFaceUp(state, action);
    case 'ClaimRoute':
      return handleClaimRoute(state, action);
    case 'DrawTickets':
      return handleDrawTickets(state, action);
  }
}

function requireActiveTurn(state: GameState, playerId: string): string | null {
  if (state.phase !== 'play' && state.phase !== 'lastRound') {
    return `Cannot act during ${state.phase}`;
  }
  if (state.turn !== playerId) return 'Not your turn';
  if (state.pendingTicketDraw) return 'Resolve pending ticket draw first';
  return null;
}

function handleDrawBlind(
  state: GameState,
  action: Extract<Action, { type: 'DrawBlind' }>,
): GameState {
  const err = requireActiveTurn(state, action.playerId);
  if (err) return logInvalid(state, action.playerId, err);

  const refilled = ensureDeckHasCards(state, 1);
  if (refilled.trainDeck.length === 0) {
    return logInvalid(refilled, action.playerId, 'No cards left to draw');
  }
  const trainDeck = [...refilled.trainDeck];
  const card = trainDeck.pop() as TrainCardColor;
  const players = giveCardToPlayer(refilled.players, action.playerId, card);

  const drewLog = appendLog(refilled, {
    type: 'drewBlind',
    playerId: action.playerId,
    card,
  });
  let next: GameState = {
    ...refilled,
    players,
    trainDeck,
    log: drewLog,
    nextEventId: refilled.nextEventId + 1,
  };
  next = afterCardDraw(next);
  return next;
}

function handleDrawFaceUp(
  state: GameState,
  action: Extract<Action, { type: 'DrawFaceUp' }>,
): GameState {
  const err = requireActiveTurn(state, action.playerId);
  if (err) return logInvalid(state, action.playerId, err);

  if (action.index < 0 || action.index >= state.faceUp.length) {
    return logInvalid(state, action.playerId, `Invalid face-up index ${action.index}`);
  }
  const card = state.faceUp[action.index] as TrainCardColor;
  if (card === 'rainbow' && state.pendingSecondCard) {
    return logInvalid(state, action.playerId, 'Cannot take face-up rainbow as second card');
  }

  // Refill: pop top of deck into the slot (or undefined slot if exhausted; we then collapse).
  const refilled = ensureDeckHasCards(state, 1);
  const trainDeck = [...refilled.trainDeck];
  const faceUp = [...refilled.faceUp];
  const replacement = trainDeck.pop();
  if (replacement !== undefined) faceUp[action.index] = replacement;
  else faceUp.splice(action.index, 1);

  const players = giveCardToPlayer(refilled.players, action.playerId, card);

  const baseLog = appendLog(refilled, {
    type: 'drewFaceUp',
    playerId: action.playerId,
    card,
    index: action.index,
  });
  let next: GameState = {
    ...refilled,
    players,
    trainDeck,
    faceUp,
    log: baseLog,
    nextEventId: refilled.nextEventId + 1,
  };
  // Apply 3-rainbow reshuffle if needed.
  next = maybeReshuffleFaceUp(next);

  if (card === 'rainbow') {
    // Drawing a face-up rainbow ends the turn whether it was first or only draw.
    return endTurn(next);
  }
  next = afterCardDraw(next);
  return next;
}

function afterCardDraw(state: GameState): GameState {
  if (!state.pendingSecondCard) {
    return { ...state, pendingSecondCard: true };
  }
  // Second card drawn — end the turn.
  return endTurn({ ...state, pendingSecondCard: false });
}

function giveCardToPlayer(
  players: PlayerState[],
  playerId: string,
  card: TrainCardColor,
): PlayerState[] {
  return players.map((p) =>
    p.id === playerId ? { ...p, hand: { ...p.hand, [card]: (p.hand[card] ?? 0) + 1 } } : p,
  );
}

function ensureDeckHasCards(state: GameState, needed: number): GameState {
  if (state.trainDeck.length >= needed) return state;
  if (state.discardPile.length === 0) return state;
  const rng = createRng(state.rngState);
  const reshuffled = rng.shuffle([...state.discardPile]);
  return {
    ...state,
    trainDeck: [...state.trainDeck, ...reshuffled],
    discardPile: [],
    rngState: rng.state(),
  };
}

function handleDrawTickets(
  state: GameState,
  action: Extract<Action, { type: 'DrawTickets' }>,
): GameState {
  const err = requireActiveTurn(state, action.playerId);
  if (err) return logInvalid(state, action.playerId, err);
  if (state.pendingSecondCard) {
    return logInvalid(state, action.playerId, 'Must finish drawing before drawing tickets');
  }
  if (state.ticketDeck.length === 0) {
    return logInvalid(state, action.playerId, 'No tickets left to draw');
  }
  const ticketDeck = [...state.ticketDeck];
  const offered: Ticket[] = [];
  for (let i = 0; i < 3 && ticketDeck.length > 0; i++) {
    offered.push(ticketDeck.pop() as Ticket);
  }
  return {
    ...state,
    ticketDeck,
    pendingTicketDraw: {
      playerId: action.playerId,
      offered,
      minKeep: 1,
    },
    log: appendLog(state, {
      type: 'drewTickets',
      playerId: action.playerId,
      offered: offered.map((t) => t.id),
    }),
    nextEventId: state.nextEventId + 1,
  };
}

const ROUTE_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 15,
};

function handleClaimRoute(
  state: GameState,
  action: Extract<Action, { type: 'ClaimRoute' }>,
): GameState {
  const err = requireActiveTurn(state, action.playerId);
  if (err) return logInvalid(state, action.playerId, err);
  if (state.pendingSecondCard) {
    return logInvalid(state, action.playerId, 'Must finish drawing before claiming');
  }
  const route = state.map.routes.find((r) => r.id === action.routeId);
  if (!route) return logInvalid(state, action.playerId, `Unknown route ${action.routeId}`);

  // Route already claimed?
  const claimed = state.players.find((p) => p.claimedRoutes.includes(route.id));
  if (claimed) return logInvalid(state, action.playerId, 'Route already claimed');

  // Parallel-route rules.
  const parallelId = route.parallel;
  if (parallelId) {
    const playerCount = state.players.length;
    const parallelClaim = state.players.find((p) => p.claimedRoutes.includes(parallelId));
    if (parallelClaim) {
      if (playerCount < 4) {
        return logInvalid(state, action.playerId, 'Parallel routes disabled at <4 players');
      }
      if (parallelClaim.id === action.playerId) {
        return logInvalid(state, action.playerId, 'Cannot claim both parallels');
      }
    }
  }

  // Spent-card validation.
  if (action.spent.length !== route.length) {
    return logInvalid(
      state,
      action.playerId,
      `Wrong card count: route needs ${route.length}, got ${action.spent.length}`,
    );
  }
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) return logInvalid(state, action.playerId, 'Unknown player');
  if (player.trainCars < route.length) {
    return logInvalid(state, action.playerId, 'Not enough train cars');
  }

  // Check the player actually owns the spent cards.
  const tally: Partial<Record<TrainCardColor, number>> = {};
  for (const c of action.spent) tally[c] = (tally[c] ?? 0) + 1;
  for (const [color, n] of Object.entries(tally)) {
    if ((player.hand[color as TrainCardColor] ?? 0) < (n ?? 0)) {
      return logInvalid(state, action.playerId, `Insufficient ${color} cards`);
    }
  }

  // Color validation.
  if (route.color === 'gray') {
    // All non-rainbow must be the same color.
    const solid = action.spent.filter((c) => c !== 'rainbow');
    const distinct = new Set(solid);
    if (distinct.size > 1) {
      return logInvalid(state, action.playerId, 'Gray route requires a single non-rainbow color');
    }
  } else {
    for (const c of action.spent) {
      if (c !== route.color && c !== 'rainbow') {
        return logInvalid(
          state,
          action.playerId,
          `Color ${c} does not match route color ${route.color}`,
        );
      }
    }
  }

  // Pay the cost.
  const newHand = { ...player.hand };
  for (const c of action.spent) newHand[c] = (newHand[c] ?? 0) - 1;

  const points = ROUTE_POINTS[route.length] ?? 0;
  const updatedPlayer: PlayerState = {
    ...player,
    hand: newHand,
    trainCars: player.trainCars - route.length,
    claimedRoutes: [...player.claimedRoutes, route.id],
    score: player.score + points,
  };
  const players = state.players.map((p) => (p.id === player.id ? updatedPlayer : p));
  const discardPile = [...state.discardPile, ...action.spent];

  // Last-round trigger: if player drops to ≤2 cars (per official rules — first time only).
  let phase = state.phase;
  let lastRoundTrigger = state.lastRoundTrigger;
  let turnsRemaining = state.turnsRemaining;
  let triggerLog: GameEvent[] = [];
  if (
    !state.lastRoundTrigger &&
    updatedPlayer.trainCars <= 2 &&
    (state.phase === 'play' || state.phase === 'lastRound')
  ) {
    phase = 'lastRound';
    lastRoundTrigger = updatedPlayer.id;
    turnsRemaining = state.players.length; // current player + others + this player's final turn already counted
    triggerLog = [
      {
        id: state.nextEventId + 1,
        type: 'lastRoundTriggered',
        playerId: updatedPlayer.id,
      },
    ];
  }

  const baseEvent: GameEvent = {
    id: state.nextEventId,
    type: 'claimedRoute',
    playerId: action.playerId,
    routeId: route.id,
    spent: [...action.spent],
  };

  const next: GameState = {
    ...state,
    players,
    discardPile,
    phase,
    lastRoundTrigger,
    turnsRemaining,
    log: [...state.log, baseEvent, ...triggerLog],
    nextEventId: state.nextEventId + 1 + triggerLog.length,
  };
  return endTurn(next);
}

function maybeReshuffleFaceUp(state: GameState): GameState {
  let current = state;
  // Loop in case the new face-up also has 3 rainbows.
  // Each iteration: if face-up has ≥3 rainbows, discard all 5, draw 5 fresh.
  // Stop if not enough cards remain (deck + discard) to populate <3 rainbows.
  for (let safety = 0; safety < 10; safety++) {
    const rainbowCount = current.faceUp.filter((c) => c === 'rainbow').length;
    if (rainbowCount < 3) return current;
    const available = current.trainDeck.length + current.discardPile.length + current.faceUp.length;
    if (available < 5) return current;
    const discardPile = [...current.discardPile, ...current.faceUp];
    let trainDeck = current.trainDeck;
    let next: GameState = {
      ...current,
      discardPile,
      faceUp: [],
      log: appendLog(current, { type: 'faceUpReshuffled', reason: 'threeRainbows' }),
      nextEventId: current.nextEventId + 1,
    };
    // Refill deck if needed, then draw five.
    next = ensureDeckHasCards(next, 5);
    trainDeck = [...next.trainDeck];
    const faceUp: TrainCardColor[] = [];
    while (faceUp.length < 5 && trainDeck.length > 0) {
      faceUp.push(trainDeck.pop() as TrainCardColor);
    }
    next = { ...next, trainDeck, faceUp };
    current = next;
  }
  return current;
}

function handleKeepTickets(
  state: GameState,
  action: Extract<Action, { type: 'KeepTickets' }>,
): GameState {
  const pending = state.pendingTicketDraw;
  if (!pending || pending.playerId !== action.playerId) {
    return logInvalid(state, action.playerId, 'No pending ticket draw for this player');
  }
  // All keeps must reference offered tickets, unique.
  const offeredIds = new Set(pending.offered.map((t) => t.id));
  const keepSet = new Set(action.keep);
  if (keepSet.size !== action.keep.length) {
    return logInvalid(state, action.playerId, 'Duplicate ticket ids in keep');
  }
  for (const id of action.keep) {
    if (!offeredIds.has(id)) {
      return logInvalid(state, action.playerId, `Ticket ${id} was not offered`);
    }
  }
  if (action.keep.length < pending.minKeep) {
    return logInvalid(state, action.playerId, `Must keep at least ${pending.minKeep} ticket(s)`);
  }

  const kept = pending.offered.filter((t) => keepSet.has(t.id));
  const discarded = pending.offered.filter((t) => !keepSet.has(t.id));

  const players = state.players.map((p) =>
    p.id === action.playerId ? { ...p, tickets: [...p.tickets, ...kept] } : p,
  );
  const ticketDiscard = [...state.ticketDiscard, ...discarded];

  // During setup, advance to the next player or start play.
  if (state.phase === 'setup') {
    return advanceSetup(state, players, ticketDiscard, action.playerId, kept, discarded);
  }

  // Mid-game ticket draw consumes the player's turn.
  const afterKeep: GameState = {
    ...state,
    players,
    ticketDiscard,
    pendingTicketDraw: undefined,
    log: appendLog(state, {
      type: 'keptTickets',
      playerId: action.playerId,
      kept: kept.map((t) => t.id),
      discarded: discarded.map((t) => t.id),
    }),
    nextEventId: state.nextEventId + 1,
  };
  return endTurn(afterKeep);
}

function advanceSetup(
  state: GameState,
  players: PlayerState[],
  ticketDiscard: Ticket[],
  actingPlayer: string,
  kept: Ticket[],
  discarded: Ticket[],
): GameState {
  const idx = state.players.findIndex((p) => p.id === actingPlayer);
  const next = state.players[idx + 1];

  const baseLog = appendLog(state, {
    type: 'keptTickets',
    playerId: actingPlayer,
    kept: kept.map((t) => t.id),
    discarded: discarded.map((t) => t.id),
  });

  if (next) {
    // Deal next player's three tickets.
    const rng = createRng(state.rngState);
    const ticketDeck = [...state.ticketDeck];
    const offered: Ticket[] = [];
    for (let i = 0; i < INITIAL_TICKETS_OFFERED && ticketDeck.length > 0; i++) {
      offered.push(ticketDeck.pop() as Ticket);
    }
    const pendingTicketDraw: PendingTicketDraw = {
      playerId: next.id,
      offered,
      minKeep: INITIAL_TICKETS_MIN_KEEP,
    };
    return {
      ...state,
      players,
      ticketDeck,
      ticketDiscard,
      pendingTicketDraw,
      log: baseLog,
      nextEventId: state.nextEventId + 1,
      rngState: rng.state(),
    };
  }

  // All players have selected; enter play phase.
  return {
    ...state,
    players,
    ticketDiscard,
    pendingTicketDraw: undefined,
    phase: 'play',
    log: baseLog,
    nextEventId: state.nextEventId + 1,
  };
}

function endTurn(state: GameState): GameState {
  const idx = state.players.findIndex((p) => p.id === state.turn);
  const nextPlayer = state.players[(idx + 1) % state.players.length];
  if (!nextPlayer) throw new Error('No players?');
  const log = appendLog(state, { type: 'turnEnded', playerId: state.turn });
  let next: GameState = {
    ...state,
    turn: nextPlayer.id,
    pendingSecondCard: false,
    log,
    nextEventId: state.nextEventId + 1,
  };
  // If we're in the last round and we just wrapped to the trigger player, finish.
  if (state.phase === 'lastRound' && state.lastRoundTrigger) {
    const turnsRemaining = (state.turnsRemaining ?? 0) - 1;
    if (turnsRemaining <= 0) {
      next = {
        ...next,
        phase: 'finished',
        turnsRemaining: 0,
        log: appendLog(next, { type: 'gameFinished' }),
        nextEventId: next.nextEventId + 1,
      };
    } else {
      next = { ...next, turnsRemaining };
    }
  }
  return next;
}

type EventBody<E = GameEvent> = E extends GameEvent ? Omit<E, 'id'> : never;

export function appendLog(state: GameState, event: EventBody): GameEvent[] {
  return [...state.log, { id: state.nextEventId, ...event } as GameEvent];
}

export function logInvalid(state: GameState, playerId: string, reason: string): GameState {
  return {
    ...state,
    log: appendLog(state, { type: 'invalid', playerId, reason }),
    nextEventId: state.nextEventId + 1,
  };
}
