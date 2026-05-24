import type { GameState, RouteId } from '@ttr/engine';
import { useMemo } from 'react';
import { PLAYER_HEX, routeStrokeHex } from '../../lib/colors.js';
import { canClaimRoute, ownershipFor } from '../../state/action-availability.js';
import { parallelSides, segmentsFor } from './route-geometry.js';

interface BoardProps {
  state: GameState;
  viewerId: string;
  selectedRouteId: RouteId | null;
  highlightedStationIds: Set<string>;
  onSelectRoute: (id: RouteId | null) => void;
}

const VIEWBOX = { x: 80, y: 80, w: 880, h: 800 };

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

  return (
    <svg
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      className="w-full h-full select-none"
      role="img"
      aria-label="Hannover Stadtbahn route map"
    >
      <rect x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill="#0f172a" />

      {/* Routes (drawn before stations so stations stack on top) */}
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

        return (
          <g key={route.id}>
            {/* invisible thicker hit area */}
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="transparent"
              strokeWidth={24}
              onClick={() => onSelectRoute(isSelected ? null : route.id)}
              className={owner ? 'cursor-default' : 'cursor-pointer'}
            />
            {segs.map((s, i) => (
              <line
                key={i}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                pointerEvents="none"
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
  );
}
