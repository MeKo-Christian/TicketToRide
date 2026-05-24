import type { GameState, RouteId } from '@ttr/engine';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PLAYER_HEX, routeStrokeHex } from '../../lib/colors.js';
import { canClaimRoute, ownershipFor } from '../../state/action-availability.js';
import { WAGON_LENGTH, parallelSides, segmentsFor } from './route-geometry.js';
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
        <defs>
          <radialGradient id="boardBg" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0b1220" />
          </radialGradient>
          <pattern id="boardGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="#475569"
              strokeWidth={0.5}
              opacity={0.35}
            />
          </pattern>
          <filter id="carShadow" x="-20%" y="-40%" width="140%" height="180%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        <rect x={-80} y={-80} width={1160} height={1040} fill="url(#boardBg)" />
        <rect
          x={-80}
          y={-80}
          width={1160}
          height={1040}
          fill="url(#boardGrid)"
          pointerEvents="none"
        />

        {/* Routes */}
        {state.map.routes.map((route) => {
          const a = stationById.get(route.a);
          const b = stationById.get(route.b);
          if (!a || !b) return null;
          const segs = segmentsFor(route, a, b, { parallelSide: sides.get(route.id) ?? 0 });
          const owner = ownership.get(route.id);
          const isSelected = selectedRouteId === route.id;
          const claimable = canClaimRoute(state, viewerId, route.id).allowed;
          const routeColor = routeStrokeHex(route.color);
          const ownerHex = owner ? (ownerColor.get(owner) ?? '#e2e8f0') : null;
          const dim = !owner && !claimable;
          const slotHeight = isSelected ? 18 : 15;
          const wagonHeight = isSelected ? 16 : 13;
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
              {segs.map((s, i) => {
                const angle = (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
                const cx = (s.x1 + s.x2) / 2;
                const cy = (s.y1 + s.y2) / 2;
                const slotOpacity = dim ? 0.45 : owner ? 0.9 : 1;
                return (
                  <g key={i}>
                    <rect
                      x={cx - WAGON_LENGTH / 2}
                      y={cy - slotHeight / 2}
                      width={WAGON_LENGTH}
                      height={slotHeight}
                      rx={3}
                      ry={3}
                      fill="#0b1220"
                      fillOpacity={0.75}
                      stroke={routeColor}
                      strokeWidth={2}
                      opacity={slotOpacity}
                      transform={`rotate(${angle} ${cx} ${cy})`}
                      pointerEvents="none"
                    />
                    {ownerHex && (
                      <motion.rect
                        x={cx - WAGON_LENGTH / 2 + 1}
                        y={cy - wagonHeight / 2}
                        width={WAGON_LENGTH - 2}
                        height={wagonHeight}
                        rx={2.5}
                        ry={2.5}
                        fill={ownerHex}
                        stroke="#f8fafc"
                        strokeWidth={1.4}
                        filter="url(#carShadow)"
                        pointerEvents="none"
                        // framer-motion drives transform via inline style, which overrides any
                        // SVG transform attribute — so the rotation must live in the animation too.
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        initial={{ opacity: 0, scale: 0.6, rotate: angle }}
                        animate={{ opacity: 1, scale: 1, rotate: angle }}
                        transition={{ duration: 0.32, delay: i * 0.06 }}
                      />
                    )}
                  </g>
                );
              })}
              {isSelected && (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.7}
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
                filter="url(#carShadow)"
              />
              <text
                x={s.x}
                y={s.y - 16}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isHi ? 700 : 600}
                stroke="#0b1220"
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                fill="#f8fafc"
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
