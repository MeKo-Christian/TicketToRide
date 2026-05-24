import type { Action, GameConfig } from '@ttr/engine';

export type RoomStatus = 'lobby' | 'playing' | 'ended';

export interface PlayerSnapshot {
  id: string;
  name: string;
  ready: boolean;
}

export interface CreateRoomMsg {
  type: 'createRoom';
  playerName: string;
}

export interface JoinRoomMsg {
  type: 'joinRoom';
  code: string;
  playerName: string;
  playerId?: string;
  lastSeq?: number;
}

export interface RoomStateMsg {
  type: 'roomState';
  code: string;
  hostId: string;
  players: PlayerSnapshot[];
  status: RoomStatus;
  seed?: number;
  seq: number;
  youId: string;
}

export interface SetReadyMsg {
  type: 'setReady';
  ready: boolean;
}

export interface StartGameMsg {
  type: 'startGame';
  config: Omit<GameConfig, 'seed'> & { seed?: number };
}

export interface ActionMsg {
  type: 'action';
  action: Action;
}

export interface ActionAppliedMsg {
  type: 'actionApplied';
  seq: number;
  action: Action;
}

export interface LeaveMsg {
  type: 'leave';
}

export interface ErrorMsg {
  type: 'error';
  code: string;
  message: string;
}

export interface PingMsg {
  type: 'ping';
  t: number;
}

export interface PongMsg {
  type: 'pong';
  t: number;
}

export type ClientToServer =
  | CreateRoomMsg
  | JoinRoomMsg
  | SetReadyMsg
  | StartGameMsg
  | ActionMsg
  | LeaveMsg
  | PingMsg;

export type ServerToClient = RoomStateMsg | ActionAppliedMsg | ErrorMsg | PongMsg;
