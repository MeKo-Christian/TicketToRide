import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from './index.js';

describe('ai', () => {
  it('lists three difficulty levels', () => {
    expect(DIFFICULTIES).toEqual(['passive', 'normal', 'aggressive']);
  });
});
