import type { PlayerId, RouteId, TicketId, TrainCardColor } from './types.js';

export type Action =
  | { type: 'DrawBlind'; playerId: PlayerId }
  | { type: 'DrawFaceUp'; playerId: PlayerId; index: number }
  | { type: 'DrawTickets'; playerId: PlayerId }
  | { type: 'KeepTickets'; playerId: PlayerId; keep: TicketId[] }
  | { type: 'ClaimRoute'; playerId: PlayerId; routeId: RouteId; spent: TrainCardColor[] };
