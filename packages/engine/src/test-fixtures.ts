import type { GameConfig, MapData, PlayerColor, Route, Station, Ticket } from './types.js';

/** Tiny synthetic map for engine unit tests. */
export function tinyMap(): MapData {
  const stations: Station[] = [
    { id: 'A', name: 'A', x: 0, y: 0 },
    { id: 'B', name: 'B', x: 1, y: 0 },
    { id: 'C', name: 'C', x: 2, y: 0 },
    { id: 'D', name: 'D', x: 1, y: 1 },
    { id: 'E', name: 'E', x: 3, y: 0 },
  ];
  const routes: Route[] = [
    { id: 'AB-blue-2', a: 'A', b: 'B', length: 2, color: 'blue', line: 1 },
    { id: 'BC-red-3', a: 'B', b: 'C', length: 3, color: 'red', line: 1 },
    { id: 'BD-gray-1', a: 'B', b: 'D', length: 1, color: 'gray', line: 2 },
    { id: 'CD-green-4', a: 'C', b: 'D', length: 4, color: 'green', line: 3 },
    // Parallel pair between C and E
    {
      id: 'CE-yellow-2-a',
      a: 'C',
      b: 'E',
      length: 2,
      color: 'yellow',
      line: 4,
      parallel: 'CE-yellow-2-b',
    },
    {
      id: 'CE-yellow-2-b',
      a: 'C',
      b: 'E',
      length: 2,
      color: 'black',
      line: 4,
      parallel: 'CE-yellow-2-a',
    },
    { id: 'DE-gray-6', a: 'D', b: 'E', length: 6, color: 'gray', line: 5 },
  ];
  const tickets: Ticket[] = [
    { id: 't-AC', from: 'A', to: 'C', points: 6 },
    { id: 't-AE', from: 'A', to: 'E', points: 10 },
    { id: 't-AD', from: 'A', to: 'D', points: 5 },
    { id: 't-BE', from: 'B', to: 'E', points: 7 },
    { id: 't-DE', from: 'D', to: 'E', points: 6 },
    { id: 't-CE', from: 'C', to: 'E', points: 3 },
    { id: 't-BD', from: 'B', to: 'D', points: 2 },
    { id: 't-AB', from: 'A', to: 'B', points: 2 },
    { id: 't-BC', from: 'B', to: 'C', points: 3 },
    { id: 't-CD', from: 'C', to: 'D', points: 4 },
    { id: 't-AC2', from: 'A', to: 'C', points: 5 },
    { id: 't-AE2', from: 'A', to: 'E', points: 8 },
    { id: 't-BE2', from: 'B', to: 'E', points: 6 },
    { id: 't-AD2', from: 'A', to: 'D', points: 4 },
  ];
  return { stations, routes, tickets };
}

const PLAYER_COLORS_ORDER: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'black'];

export function defaultConfig(n: number, seed = 1): GameConfig {
  if (n < 2 || n > 5) throw new Error(`n must be 2-5, got ${n}`);
  return {
    players: Array.from({ length: n }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      color: PLAYER_COLORS_ORDER[i] as PlayerColor,
      isAI: false,
    })),
    map: tinyMap(),
    seed,
  };
}
