import type { Difficulty } from '@ttr/ai';
import type { Action, GameConfig, GameState, PlayerColor } from '@ttr/engine';
// PlayerColor type imported above for defaultColor() helper
import { initialState, reduce } from '@ttr/engine';
import { hannoverMap } from '@ttr/map-data';
import { create } from 'zustand';
import { MP_SERVER_URL, MpClient } from '../net/mpClient.js';
import type { ActionAppliedMsg, RoomStateMsg } from '../net/protocol.js';

export type Screen = 'home' | 'setup' | 'lobby' | 'play' | 'scoring';
export type Mode = 'local' | 'online';

interface GameStore {
  screen: Screen;
  mode: Mode;
  state: GameState | null;
  /** The id of the player currently "seated" at the device (hot-seat hand-hide). */
  seatedPlayerId: string | null;
  /** Difficulty per AI-controlled player. Humans absent from the map. */
  difficulties: Record<string, Difficulty>;
  /** Highest sequence number applied from the server (online mode). */
  seq: number;
  /** Buffered remote actions waiting for missing seqs. */
  pending: Map<number, Action>;
  /** Live MP client when in online mode. */
  mp: MpClient | null;
  /** Last room snapshot we received. */
  room: RoomStateMsg | null;
  /** Display name used to (re)join. */
  playerName: string;

  goHome: () => void;
  goSetup: () => void;
  startGame: (config: GameConfig, difficulties?: Record<string, Difficulty>) => void;
  dispatch: (action: Action) => void;
  applyRemote: (msg: ActionAppliedMsg) => void;
  onRoomState: (msg: RoomStateMsg) => void;
  seat: (playerId: string) => void;
  reset: () => void;

  // Online flow
  enterOnline: (playerName: string) => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  setReady: (ready: boolean) => void;
  startOnlineGame: () => void;
  leaveOnline: () => void;
}

const STORAGE_PLAYER_ID = 'ttr-mp-player-id';
const STORAGE_LAST_CODE = 'ttr-mp-last-code';
const STORAGE_LAST_SEQ = 'ttr-mp-last-seq';

function persistedPlayerId(code: string): string | undefined {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_PLAYER_ID) ?? '{}');
    return map[code];
  } catch {
    return undefined;
  }
}

function rememberPlayerId(code: string, id: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_PLAYER_ID) ?? '{}');
    map[code] = id;
    localStorage.setItem(STORAGE_PLAYER_ID, JSON.stringify(map));
    localStorage.setItem(STORAGE_LAST_CODE, code);
  } catch {
    // best-effort
  }
}

function rememberSeq(code: string, seq: number): void {
  try {
    localStorage.setItem(`${STORAGE_LAST_SEQ}:${code}`, String(seq));
  } catch {
    // best-effort
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'home',
  mode: 'local',
  state: null,
  seatedPlayerId: null,
  difficulties: {},
  seq: 0,
  pending: new Map(),
  mp: null,
  room: null,
  playerName: '',

  goHome: () => {
    get().mp?.close();
    set({
      screen: 'home',
      mode: 'local',
      state: null,
      seatedPlayerId: null,
      difficulties: {},
      seq: 0,
      pending: new Map(),
      mp: null,
      room: null,
    });
  },
  goSetup: () => set({ screen: 'setup', mode: 'local' }),

  startGame: (config, difficulties = {}) => {
    const s = initialState(config);
    const firstHuman = config.players.find((p) => !p.isAI);
    set({
      state: s,
      seatedPlayerId: firstHuman?.id ?? s.turn,
      difficulties,
      mode: 'local',
      screen: 'play',
    });
  },

  dispatch: (action) => {
    const { mode, mp, state } = get();
    if (mode === 'online') {
      mp?.sendAction(action);
      return;
    }
    if (!state) return;
    set({ state: reduce(state, action) });
  },

  applyRemote: (msg) => {
    const { seq, pending, state, room } = get();
    let curSeq = seq;
    let curState = state;
    const buffer = new Map(pending);
    buffer.set(msg.seq, msg.action);

    let next = buffer.get(curSeq + 1);
    while (next !== undefined) {
      curState = curState ? reduce(curState, next) : null;
      buffer.delete(curSeq + 1);
      curSeq += 1;
      next = buffer.get(curSeq + 1);
    }
    if (room) rememberSeq(room.code, curSeq);

    // Auto-route to scoring if the engine reports finished.
    const nextScreen = curState?.phase === 'finished' ? 'scoring' : get().screen;
    set({ seq: curSeq, pending: buffer, state: curState, screen: nextScreen });
  },

  onRoomState: (msg) => {
    rememberPlayerId(msg.code, msg.youId);
    set({ room: msg, seatedPlayerId: msg.youId });
    if (msg.status === 'playing' && get().state === null && msg.seed !== undefined) {
      // Boot local engine from broadcast seed.
      const players = msg.players.map((p, i) => ({
        id: p.id,
        name: p.name,
        color: defaultColor(i),
        isAI: false,
      }));
      const cfg: GameConfig = { seed: msg.seed, map: hannoverMap, players };
      set({ state: initialState(cfg), screen: 'play', mode: 'online' });
    }
    if (msg.status === 'ended' && get().screen !== 'home') {
      set({ screen: 'home' });
    }
  },

  seat: (playerId) => set({ seatedPlayerId: playerId }),
  reset: () => {
    get().mp?.close();
    set({
      screen: 'home',
      mode: 'local',
      state: null,
      seatedPlayerId: null,
      difficulties: {},
      seq: 0,
      pending: new Map(),
      mp: null,
      room: null,
    });
  },

  enterOnline: (playerName) => {
    if (!MP_SERVER_URL) return;
    const existing = get().mp;
    if (existing) existing.close();
    const mp = new MpClient(MP_SERVER_URL);
    mp.on('roomState', (m) => get().onRoomState(m));
    mp.on('actionApplied', (m) => get().applyRemote(m));
    mp.connect();
    set({ mp, mode: 'online', screen: 'lobby', playerName });
  },

  createRoom: () => {
    const { mp, playerName } = get();
    mp?.createRoom(playerName);
  },

  joinRoom: (code) => {
    const { mp, playerName } = get();
    const normalised = code.trim().toUpperCase();
    const pid = persistedPlayerId(normalised);
    const lastSeq = (() => {
      try {
        const v = localStorage.getItem(`${STORAGE_LAST_SEQ}:${normalised}`);
        return v ? Number(v) : undefined;
      } catch {
        return undefined;
      }
    })();
    mp?.joinRoom(normalised, playerName, pid, lastSeq);
  },

  setReady: (ready) => get().mp?.setReady(ready),

  startOnlineGame: () => {
    // Server computes the seed; we pass map identifier via empty config payload.
    // The room.onRoomState handler will boot the engine when seed arrives.
    const cfg = { map: hannoverMap, players: [] } as Omit<GameConfig, 'seed'>;
    get().mp?.startGame(cfg);
  },

  leaveOnline: () => {
    get().mp?.leave();
    get().mp?.close();
    set({
      mp: null,
      mode: 'local',
      screen: 'home',
      room: null,
      state: null,
      seq: 0,
      pending: new Map(),
    });
  },
}));

const COLOR_ORDER: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'black'];
function defaultColor(i: number): PlayerColor {
  return COLOR_ORDER[i] ?? 'red';
}
