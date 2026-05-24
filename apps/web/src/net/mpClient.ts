import type { Action, GameConfig } from '@ttr/engine';
import type {
  ActionAppliedMsg,
  ClientToServer,
  ErrorMsg,
  RoomStateMsg,
  ServerToClient,
} from './protocol.js';

export interface MpEvents {
  roomState: (msg: RoomStateMsg) => void;
  actionApplied: (msg: ActionAppliedMsg) => void;
  error: (msg: ErrorMsg) => void;
  open: () => void;
  close: () => void;
}

type EventName = keyof MpEvents;

/**
 * `serverUrl` is the build-time `VITE_MP_SERVER_URL`. When unset, the calling
 * UI must hide the Online entry point entirely. This module assumes the caller
 * has already checked.
 */
export class MpClient {
  private ws: WebSocket | null = null;
  private listeners: { [K in EventName]: Set<MpEvents[K]> } = {
    roomState: new Set(),
    actionApplied: new Set(),
    error: new Set(),
    open: new Set(),
    close: new Set(),
  };
  private reconnectAttempts = 0;
  private explicitlyClosed = false;
  private pendingSends: ClientToServer[] = [];

  constructor(private serverUrl: string) {}

  on<K extends EventName>(event: K, cb: MpEvents[K]): () => void {
    this.listeners[event].add(cb);
    return () => this.listeners[event].delete(cb);
  }

  private emit<K extends EventName>(event: K, ...args: Parameters<MpEvents[K]>): void {
    for (const cb of this.listeners[event]) {
      (cb as (...a: unknown[]) => void)(...args);
    }
  }

  connect(): void {
    if (this.ws && this.ws.readyState <= 1) return;
    this.explicitlyClosed = false;
    const ws = new WebSocket(this.serverUrl);
    this.ws = ws;
    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('open');
      const queued = this.pendingSends;
      this.pendingSends = [];
      for (const m of queued) this.send(m);
    };
    ws.onclose = () => {
      this.emit('close');
      if (!this.explicitlyClosed) this.scheduleReconnect();
    };
    ws.onerror = () => {
      // close handler will run after; nothing to do here.
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerToClient;
        switch (msg.type) {
          case 'roomState':
            this.emit('roomState', msg);
            break;
          case 'actionApplied':
            this.emit('actionApplied', msg);
            break;
          case 'error':
            this.emit('error', msg);
            break;
          case 'pong':
            break;
        }
      } catch {
        // ignore malformed
      }
    };
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const delay = Math.min(15_000, 500 * 2 ** Math.min(5, this.reconnectAttempts));
    setTimeout(() => this.connect(), delay);
  }

  close(): void {
    this.explicitlyClosed = true;
    this.ws?.close();
    this.ws = null;
  }

  private send(msg: ClientToServer): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.pendingSends.push(msg);
      this.connect();
    }
  }

  createRoom(playerName: string): void {
    this.send({ type: 'createRoom', playerName });
  }

  joinRoom(code: string, playerName: string, playerId?: string, lastSeq?: number): void {
    this.send({ type: 'joinRoom', code, playerName, playerId, lastSeq });
  }

  setReady(ready: boolean): void {
    this.send({ type: 'setReady', ready });
  }

  startGame(config: Omit<GameConfig, 'seed'>): void {
    this.send({ type: 'startGame', config });
  }

  sendAction(action: Action): void {
    this.send({ type: 'action', action });
  }

  leave(): void {
    this.send({ type: 'leave' });
  }
}

export const MP_SERVER_URL: string = (import.meta.env.VITE_MP_SERVER_URL ?? '').trim();
export const isOnlineModeAvailable = (): boolean => MP_SERVER_URL.length > 0;
