import type { Difficulty } from '@ttr/ai';
import type { Action, GameConfig, GameState } from '@ttr/engine';
import { initialState, reduce } from '@ttr/engine';
import { create } from 'zustand';

interface GameStore {
  state: GameState | null;
  /** The id of the player currently "seated" at the device. Used for hot-seat hand-hide. */
  seatedPlayerId: string | null;
  /** Difficulty per AI-controlled player. Humans absent from the map. */
  difficulties: Record<string, Difficulty>;
  startGame: (config: GameConfig, difficulties?: Record<string, Difficulty>) => void;
  dispatch: (action: Action) => void;
  /** Mark a player as having taken their seat (acknowledged the handoff splash). */
  seat: (playerId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  seatedPlayerId: null,
  difficulties: {},
  startGame: (config, difficulties = {}) => {
    const s = initialState(config);
    const firstHuman = config.players.find((p) => !p.isAI);
    set({ state: s, seatedPlayerId: firstHuman?.id ?? s.turn, difficulties });
  },
  dispatch: (action) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: reduce(cur, action) });
  },
  seat: (playerId) => set({ seatedPlayerId: playerId }),
  reset: () => set({ state: null, seatedPlayerId: null, difficulties: {} }),
}));
