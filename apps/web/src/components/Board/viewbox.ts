export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ViewBoxBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  minW: number;
  maxW: number;
}

/** Convert a client-space point to view-space using the SVG element's bounding rect. */
export function clientToView(
  vb: ViewBox,
  rect: { left: number; top: number; width: number; height: number },
  client: { x: number; y: number },
): { x: number; y: number } {
  const sx = vb.w / rect.width;
  const sy = vb.h / rect.height;
  return {
    x: vb.x + (client.x - rect.left) * sx,
    y: vb.y + (client.y - rect.top) * sy,
  };
}

/** Zoom by `factor` (< 1 zooms in, > 1 zooms out) anchored at a client point. */
export function applyZoom(
  vb: ViewBox,
  factor: number,
  anchorClient: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  bounds: ViewBoxBounds,
): ViewBox {
  const anchorView = clientToView(vb, rect, anchorClient);
  const aspect = vb.h / vb.w;
  const newW = clamp(vb.w * factor, bounds.minW, bounds.maxW);
  const newH = newW * aspect;
  const newX = anchorView.x - (anchorView.x - vb.x) * (newW / vb.w);
  const newY = anchorView.y - (anchorView.y - vb.y) * (newH / vb.h);
  return clampViewBox({ x: newX, y: newY, w: newW, h: newH }, bounds);
}

/** Pan by client-space pixel delta. */
export function applyPan(
  vb: ViewBox,
  dxClient: number,
  dyClient: number,
  rect: { width: number; height: number },
  bounds: ViewBoxBounds,
): ViewBox {
  const sx = vb.w / rect.width;
  const sy = vb.h / rect.height;
  return clampViewBox(
    { x: vb.x - dxClient * sx, y: vb.y - dyClient * sy, w: vb.w, h: vb.h },
    bounds,
  );
}

export function clampViewBox(vb: ViewBox, b: ViewBoxBounds): ViewBox {
  const w = clamp(vb.w, b.minW, b.maxW);
  const h = (w * vb.h) / vb.w;
  const maxXAllowed = b.maxX - w;
  const maxYAllowed = b.maxY - h;
  const x = clamp(vb.x, b.minX, Math.max(b.minX, maxXAllowed));
  const y = clamp(vb.y, b.minY, Math.max(b.minY, maxYAllowed));
  return { x, y, w, h };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
