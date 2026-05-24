import type { Action, GameConfig, GameState } from '@ttr/engine';
import { initialState, reduce } from '@ttr/engine';
import { create } from 'zustand';

interface GameStore {
  state: GameState | null;
  /** The id of the player currently "seated" at the device. Used for hot-seat hand-hide. */
  seatedPlayerId: string | null;
  startGame: (config: GameConfig) => void;
  dispatch: (action: Action) => void;
  /** Mark a player as having taken their seat (acknowledged the handoff splash). */
  seat: (playerId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  seatedPlayerId: null,
  startGame: (config) => {
    const s = initialState(config);
    set({ state: s, seatedPlayerId: s.turn });
  },
  dispatch: (action) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: reduce(cur, action) });
  },
  seat: (playerId) => set({ seatedPlayerId: playerId }),
  reset: () => set({ state: null, seatedPlayerId: null }),
}));
