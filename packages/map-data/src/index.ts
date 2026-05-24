import type { MapData } from '@ttr/engine';
import { hannoverFunMap } from './hannover-fun.js';
import { hannoverMap } from './hannover.js';

export interface MapMeta {
  /** Stable id used to select the map (e.g. persisted in config). */
  id: string;
  /** Display name shown in the setup picker. */
  name: string;
  /** One-line description of the map's character. */
  description: string;
  map: MapData;
}

/** All maps available to pick from in setup. The first entry is the default. */
export const MAPS: MapMeta[] = [
  {
    id: 'hannover',
    name: 'Hannover Stadtbahn',
    description: 'Faithful to the real Stadtbahn line network.',
    map: hannoverMap,
  },
  {
    id: 'hannover-fun',
    name: 'Greater Hannover (Fun)',
    description: 'Geographic layout, denser fictional connections tuned for play.',
    map: hannoverFunMap,
  },
];

export function mapById(id: string): MapData {
  return (MAPS.find((m) => m.id === id) ?? MAPS[0]!).map;
}

/** Back-compat: the default map name. */
export const MAP_NAME = MAPS[0]!.name;

export { hannoverMap } from './hannover.js';
export { hannoverFunMap } from './hannover-fun.js';
