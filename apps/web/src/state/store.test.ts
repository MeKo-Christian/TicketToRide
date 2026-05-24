import type { GameConfig } from '@ttr/engine';
import { hannoverMap } from '@ttr/map-data';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './store.js';

function cfg(): GameConfig {
  return {
    seed: 42,
    map: hannoverMap,
    players: [
      { id: 'a', name: 'Alice', color: 'red', isAI: false },
      { id: 'b', name: 'Bob', color: 'blue', isAI: false },
    ],
  };
}

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts with no state', () => {
    expect(useGameStore.getState().state).toBeNull();
  });

  it('startGame initialises state and seats the first player', () => {
    useGameStore.getState().startGame(cfg());
    const s = useGameStore.getState();
    expect(s.state?.phase).toBe('setup');
    expect(s.state?.players).toHaveLength(2);
    expect(s.seatedPlayerId).toBe(s.state?.turn);
  });

  it('dispatch advances state through the reducer', () => {
    useGameStore.getState().startGame(cfg());
    const before = useGameStore.getState().state!;
    const firstTurn = before.turn;
    const offered = before.pendingTicketDraw!.offered;

    useGameStore.getState().dispatch({
      type: 'KeepTickets',
      playerId: firstTurn,
      keep: offered.slice(0, 2).map((t) => t.id),
    });

    const after = useGameStore.getState().state!;
    expect(after).not.toBe(before);
    // Second player now has their setup ticket draw.
    expect(after.pendingTicketDraw?.playerId).not.toBe(firstTurn);
  });

  it('dispatch with no state is a no-op (does not throw)', () => {
    expect(() =>
      useGameStore.getState().dispatch({ type: 'DrawBlind', playerId: 'x' }),
    ).not.toThrow();
  });

  it('reset clears state and seat', () => {
    useGameStore.getState().startGame(cfg());
    useGameStore.getState().reset();
    expect(useGameStore.getState().state).toBeNull();
    expect(useGameStore.getState().seatedPlayerId).toBeNull();
  });
});
