import type { GameState, RouteId } from '@ttr/engine';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PLAYER_HEX, routeStrokeHex } from '../../lib/colors.js';
import { canClaimRoute, ownershipFor } from '../../state/action-availability.js';
import { parallelSides, segmentsFor } from './route-geometry.js';
import { type ViewBox, type ViewBoxBounds, applyPan, applyZoom } from './viewbox.js';

interface BoardProps {
  state: GameState;
  viewerId: string;
  selectedRouteId: RouteId | null;
  highlightedStationIds: Set<string>;
  onSelectRoute: (id: RouteId | null) => void;
}

const INITIAL_VB: ViewBox = { x: 80, y: 80, w: 880, h: 800 };
const BOUNDS: ViewBoxBounds = {
  minX: -80,
  minY: -80,
  maxX: 1080,
  maxY: 960,
  minW: 250,
  maxW: 1100,
};

export function Board({
  state,
  viewerId,
  selectedRouteId,
  highlightedStationIds,
  onSelectRoute,
}: BoardProps) {
  const stationById = useMemo(
    () => new Map(state.map.stations.map((s) => [s.id, s])),
    [state.map.stations],
  );
  const sides = useMemo(() => parallelSides(state.map.routes), [state.map.routes]);
  const ownership = useMemo(() => ownershipFor(state), [state]);
  const ownerColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of state.players) m.set(p.id, PLAYER_HEX[p.color]);
    return m;
  }, [state.players]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [vb, setVb] = useState<ViewBox>(INITIAL_VB);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
    setVb((cur) => applyZoom(cur, factor, { x: e.clientX, y: e.clientY }, rect, BOUNDS));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Only pan when the background was clicked (not a route or station)
    if ((e.target as SVGElement).tagName === 'rect' || e.target === svgRef.current) {
      dragRef.current = { x: e.clientX, y: e.clientY };
      svgRef.current?.setPointerCapture(e.pointerId);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setVb((cur) => applyPan(cur, dx, dy, rect, BOUNDS));
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  const resetView = useCallback(() => setVb(INITIAL_VB), []);
  const zoomBy = useCallback((factor: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setVb((cur) =>
      applyZoom(
        cur,
        factor,
        { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        rect,
        BOUNDS,
      ),
    );
  }, []);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full h-full select-none touch-none"
        role="img"
        aria-label="Hannover Stadtbahn route map"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
      >
        <rect x={-80} y={-80} width={1160} height={1040} fill="#0f172a" />

        {/* Routes */}
        {state.map.routes.map((route) => {
          const a = stationById.get(route.a);
          const b = stationById.get(route.b);
          if (!a || !b) return null;
          const segs = segmentsFor(route, a, b, { parallelSide: sides.get(route.id) ?? 0 });
          const owner = ownership.get(route.id);
          const isSelected = selectedRouteId === route.id;
          const claimable = canClaimRoute(state, viewerId, route.id).allowed;
          const stroke = owner ? (ownerColor.get(owner) ?? '#e2e8f0') : routeStrokeHex(route.color);
          const opacity = owner ? 1 : claimable ? 1 : 0.55;
          const strokeWidth = isSelected ? 14 : 11;
          const ariaLabel = `Route ${route.color} length ${route.length} from ${stationById.get(route.a)?.name ?? route.a} to ${stationById.get(route.b)?.name ?? route.b}${owner ? `, owned by ${state.players.find((p) => p.id === owner)?.name ?? owner}` : claimable ? ', claimable' : ''}`;

          return (
            <g key={route.id}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="transparent"
                strokeWidth={24}
                onClick={() => onSelectRoute(isSelected ? null : route.id)}
                className={owner ? 'cursor-default' : 'cursor-pointer'}
                role="button"
                tabIndex={owner ? -1 : 0}
                aria-label={ariaLabel}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (owner) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRoute(isSelected ? null : route.id);
                  }
                }}
              />
              {segs.map((s, i) => (
                <motion.line
                  key={i}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  pointerEvents="none"
                  initial={owner ? { opacity: 0, pathLength: 0 } : false}
                  animate={{ opacity, pathLength: 1 }}
                  transition={{ duration: 0.4, delay: owner ? i * 0.06 : 0 }}
                />
              ))}
              {isSelected && (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.6}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* Stations */}
        {state.map.stations.map((s) => {
          const isHi = highlightedStationIds.has(s.id);
          return (
            <g key={s.id}>
              <circle
                cx={s.x}
                cy={s.y}
                r={isHi ? 14 : 10}
                fill="#0f172a"
                stroke={isHi ? '#facc15' : '#cbd5e1'}
                strokeWidth={isHi ? 4 : 2}
              />
              <text
                x={s.x}
                y={s.y - 16}
                textAnchor="middle"
                className="fill-slate-100"
                fontSize={11}
                fontWeight={isHi ? 700 : 500}
                pointerEvents="none"
              >
                {s.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-slate-900/80 border border-slate-700 rounded-lg p-1 shadow-lg">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.25)}
          className="w-8 h-8 rounded text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          className="w-8 h-8 rounded text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          className="w-8 h-8 rounded text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs"
          aria-label="Reset view"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
