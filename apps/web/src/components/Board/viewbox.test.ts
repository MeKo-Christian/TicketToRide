import { describe, expect, it } from 'vitest';
import { applyPan, applyZoom, clampViewBox, clientToView } from './viewbox.js';

const bounds = { minX: 0, minY: 0, maxX: 1000, maxY: 800, minW: 200, maxW: 1000 };
const rect = { left: 0, top: 0, width: 800, height: 640 };
const vb = { x: 0, y: 0, w: 1000, h: 800 };

describe('clientToView', () => {
  it('maps the top-left corner to the viewbox origin', () => {
    expect(clientToView(vb, rect, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
  it('maps the centre to the viewbox centre', () => {
    expect(clientToView(vb, rect, { x: 400, y: 320 })).toEqual({ x: 500, y: 400 });
  });
});

describe('applyZoom', () => {
  it('zooming in halves the width', () => {
    const next = applyZoom(vb, 0.5, { x: 400, y: 320 }, rect, bounds);
    expect(next.w).toBe(500);
    expect(next.h).toBe(400);
  });
  it('zooming about the centre keeps the centre fixed', () => {
    const next = applyZoom(vb, 0.5, { x: 400, y: 320 }, rect, bounds);
    const centreX = next.x + next.w / 2;
    const centreY = next.y + next.h / 2;
    expect(centreX).toBeCloseTo(500);
    expect(centreY).toBeCloseTo(400);
  });
  it('cannot zoom past maxW', () => {
    const next = applyZoom(vb, 4, { x: 400, y: 320 }, rect, bounds);
    expect(next.w).toBe(bounds.maxW);
  });
  it('cannot zoom below minW', () => {
    const next = applyZoom(vb, 0.01, { x: 400, y: 320 }, rect, bounds);
    expect(next.w).toBe(bounds.minW);
  });
});

describe('applyPan', () => {
  it('panning right (negative dx) shifts viewbox left', () => {
    const zoomed = applyZoom(vb, 0.5, { x: 400, y: 320 }, rect, bounds);
    const next = applyPan(zoomed, -100, 0, rect, bounds);
    expect(next.x).toBeGreaterThan(zoomed.x);
  });
  it('cannot pan past the bounds', () => {
    const zoomed = applyZoom(vb, 0.5, { x: 400, y: 320 }, rect, bounds);
    const next = applyPan(zoomed, -10000, 0, rect, bounds);
    expect(next.x + next.w).toBeLessThanOrEqual(bounds.maxX + 0.001);
  });
});

describe('clampViewBox', () => {
  it('keeps a valid viewbox unchanged', () => {
    expect(clampViewBox(vb, bounds)).toEqual(vb);
  });
  it('clamps width above maxW back to maxW', () => {
    const out = clampViewBox({ x: 0, y: 0, w: 9999, h: 7999 }, bounds);
    expect(out.w).toBe(bounds.maxW);
  });
});
