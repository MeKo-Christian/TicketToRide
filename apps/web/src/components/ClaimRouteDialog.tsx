import type { GameState, RouteId, TrainCardColor } from '@ttr/engine';
import { CARD_HEX, routeStrokeHex } from '../lib/colors.js';
import { validSpendOptions } from '../state/action-availability.js';
import { useGameStore } from '../state/store.js';

interface ClaimRouteDialogProps {
  state: GameState;
  viewerId: string;
  routeId: RouteId;
  onClose: () => void;
}

export function ClaimRouteDialog({ state, viewerId, routeId, onClose }: ClaimRouteDialogProps) {
  const dispatch = useGameStore((s) => s.dispatch);
  const route = state.map.routes.find((r) => r.id === routeId);
  if (!route) return null;

  const a = state.map.stations.find((s) => s.id === route.a)!;
  const b = state.map.stations.find((s) => s.id === route.b)!;
  const options = validSpendOptions(state, viewerId, routeId);

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-30">
      <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-700 shadow-2xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Claim route</h2>
            <p className="text-sm text-slate-400">
              {a.name} ↔ {b.name} · {route.length} car{route.length === 1 ? '' : 's'}
            </p>
          </div>
          <span
            className="inline-block w-6 h-6 rounded-full border-2 border-slate-600"
            style={{ backgroundColor: routeStrokeHex(route.color) }}
            title={`Route colour: ${route.color}`}
          />
        </header>

        {options.length === 0 ? (
          <p className="text-amber-400 text-sm">
            You don't have enough matching cards to claim this route.
          </p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {options.map((opt, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'ClaimRoute', playerId: viewerId, routeId, spent: opt });
                    onClose();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                  {opt.map((c, j) => (
                    <span
                      key={j}
                      className="inline-block w-6 h-8 rounded border border-slate-600 text-[10px] font-bold flex items-center justify-center"
                      style={{
                        background:
                          c === 'rainbow'
                            ? 'linear-gradient(135deg,#dc2626,#facc15,#16a34a,#2563eb,#a855f7)'
                            : CARD_HEX[c as TrainCardColor],
                        color: c === 'yellow' || c === 'white' ? '#0f172a' : '#fff',
                      }}
                    >
                      {c === 'rainbow' ? '★' : c[0]?.toUpperCase()}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-slate-400">
                    {opt.filter((c) => c === 'rainbow').length > 0
                      ? `(${opt.filter((c) => c === 'rainbow').length} rainbow)`
                      : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
