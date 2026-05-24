import { describe, expect, it } from 'vitest';
import { MAP_NAME } from './index.js';

describe('map-data', () => {
  it('names the map', () => {
    expect(MAP_NAME).toBe('Hannover Stadtbahn');
  });
});
